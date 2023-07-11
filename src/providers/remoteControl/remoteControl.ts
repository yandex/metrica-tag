import { parse as parseJson } from 'src/utils/json';
import {
    getButtonData,
    getCachedTags,
    getElemCreateFunction,
    getRootElement,
    loadScript,
} from 'src/utils/dom';
import { getGlobalStorage } from 'src/storage/global';
import {
    CLICK_TRACKING_FEATURE,
    HIDE_PHONES_FEATURE,
    LOCAL_FEATURE,
    SUBMIT_TRACKING_FEATURE,
    CHECK_STATUS_FEATURE,
} from 'generated/features';
import {
    memo,
    pipe,
    bindArg,
    bindThisForMethodTest,
    bindArgs,
    firstArg,
    cont,
    ctxBindArgs,
    call,
} from 'src/utils/function';
import { getPath } from 'src/utils/object';
import { cEvent } from 'src/utils/events';
import { flags } from '@inject';
import {
    arrayJoin,
    cForEach,
    cSome,
    ctxMap,
    filterFalsy,
    includes,
} from 'src/utils/array';
import { closestButton, selectButtons } from 'src/utils/dom/button';
import { closestForm, getFormData, selectForms } from 'src/utils/dom/form';
import { hidePhones } from 'src/utils/phones/phonesHide';
import { checkStatusFn } from 'src/providers/statusCheck/statusCheckFn';
import { parseDecimalInt } from 'src/utils/number';
import { AnyFunc } from 'src/utils/function/types';

/* eslint-disable camelcase */
type ExtendedWindow = Window & {
    _ym__remoteIframeEl?: HTMLIFrameElement;
    _ym__remoteIframeContainer?: HTMLIFrameElement;
    _ym__postMessageEvent?: MessageEvent;
    _ym__inpageMode?: string;
    _ym__initMessage?: string;
};
/* eslint-enable camelcase */

export const REMOTE_CONTROL = 'i'; // key for the global config

const buildRemoteIframe = (ctx: ExtendedWindow, src: string) => {
    const createElement = getElemCreateFunction(ctx);

    if (!createElement) {
        return;
    }

    type shadowRootMethodNames = 'createShadowRoot' | 'webkitCreateShadowRoot';
    const iframeContainer = createElement('div') as HTMLDivElement &
        {
            [key in shadowRootMethodNames]?: () => ShadowRoot;
        };
    const root = getRootElement(ctx);

    if (!root) {
        return;
    }

    iframeContainer.innerHTML =
        '<iframe name="RemoteIframe" allowtransparency="true" style="position: absolute; left: -999px; top: -999px; width: 1px; height: 1px;"></iframe>';

    const iframeEl = iframeContainer.firstChild as HTMLIFrameElement & {
        createShadowRoot: () => ShadowRoot;
        webkitCreateShadowRoot: () => ShadowRoot;
    };
    // нельзя использовать bind, т.к. здесь iframeEl.contentWindow все еще null
    iframeEl.onload = () => {
        const csp = createElement('meta') as HTMLMetaElement;
        csp.setAttribute('http-equiv', 'Content-Security-Policy');
        // Тут нет unsafe-inline, поэтому попытка сделать location.href = "javascript:" зафейлится об csp
        csp.setAttribute('content', 'script-src *');
        iframeEl.contentWindow!.document.head.appendChild(csp);

        loadScript(iframeEl.contentWindow as Window, { src });
    };

    // eslint-disable-next-line camelcase,no-underscore-dangle
    ctx['_ym__remoteIframeEl'] = iframeEl;

    root.appendChild(iframeContainer);
    iframeContainer.removeChild(iframeEl);

    let shadowRoot = null;

    if (iframeContainer.attachShadow) {
        shadowRoot = iframeContainer.attachShadow({ mode: 'open' });
    } else if (iframeContainer.createShadowRoot) {
        shadowRoot = iframeContainer.createShadowRoot();
    } else if (iframeContainer.webkitCreateShadowRoot) {
        shadowRoot = iframeContainer.webkitCreateShadowRoot();
    }

    if (shadowRoot) {
        shadowRoot.appendChild(iframeEl);
    } else {
        root.appendChild(iframeEl);
        ctx['_ym__remoteIframeContainer'] = iframeEl;
    }
};

export const isAllowedOrigin = (origin: string) =>
    cSome(pipe(bindThisForMethodTest, cont(origin)), [
        /^http:\/\/([\w\-.]+\.)?webvisor\.com\/?$/,
        /^https:\/\/([\w\-.]+\.)?metri[kc]a\.yandex\.(ru|ua|by|kz|com|com\.tr)\/?$/,
    ]);

/**
 * (\.)(?!\.) - точка, но не две точки подряд
 * нужно для защиты от yastatic.net/s3/metrika/../evil-bucket/script.js
 */
export const isAllowedResource = bindThisForMethodTest(
    /^https:\/\/(yastatic\.net\/s3\/metrika|s3\.mds\.yandex\.net\/internal-metrika-betas|[\w-]+\.dev\.webvisor\.com|[\w-]+\.dev\.metrika\.yandex\.ru)\/(\w|-|\/|(\.)(?!\.))+\.js$/,
) as unknown as (staticUrl: string) => boolean;

type InlineMessageProps = Partial<{
    inline: boolean;
    data: string;
    appVersion: string;
    lang: string;
    fileId: string;
    beta: boolean;
}>;

/**
 * Feature activation request
 */
export type Message = {
    /** Type of action to perform on page */
    action: string;
    /** URL of resource to load */
    resource: string;
    /** Request id */
    id: string;
    /** Functionality type, for example clickmap */
    inpageMode: string;
    /** Feature init data */
    initMessage: string;
} & InlineMessageProps;

export const UTILS_KEY = '_u';
export const UTILS_CLOSEST_KEY = 'closest';
export const UTILS_SELECT_KEY = 'select';
export const UTILS_GET_DATA_KEY = 'getData';

export const UTILS_HIDE_PHONES_KEY = 'hidePhones';
export const UTILS_CHECK_STATUS_KEY = 'checkStatus';

const SPLITTER = '.';
const AVAILABLE_FILES = ['form', 'button', 'phone', 'status'];

const BETA_URL = 'https://s3.mds.yandex.net/internal-metrika-betas';
const URL = 'https://yastatic.net/s3/metrika';

export const getResourceUrl = (message: InlineMessageProps): string => {
    const {
        ['lang']: lang = '',
        ['appVersion']: appVersion = '',
        ['fileId']: fileId = '',
        ['beta']: beta = false,
    } = message;
    const validVersion = arrayJoin(
        SPLITTER,
        pipe(
            ctxMap(pipe(firstArg, parseDecimalInt)),
            filterFalsy,
        )(appVersion.split(SPLITTER)),
    );

    if (
        !includes(fileId, AVAILABLE_FILES) ||
        !includes(lang, ['ru', 'en', 'tr'])
    ) {
        return '';
    }

    const baseUrl = beta ? BETA_URL : URL;
    const version = validVersion ? `/${validVersion}` : '';
    const fileName = `${fileId}_${lang}.js`;

    const result = `${baseUrl}${version}/form-selector/${fileName}`;
    if (!isAllowedResource(result)) {
        return '';
    }

    return result;
};

export const setupUtilsAndLoadScript = (
    ctx: ExtendedWindow,
    src?: string,
    counterId = '',
    phones = '',
) => {
    if (flags[CLICK_TRACKING_FEATURE] || flags[SUBMIT_TRACKING_FEATURE]) {
        const globalConfig = getGlobalStorage(ctx);
        const utils: Record<
            string,
            typeof getCachedTags | Record<string, AnyFunc>
        > = {};

        utils['getCachedTags'] = getCachedTags;
        if (flags[SUBMIT_TRACKING_FEATURE]) {
            utils['form'] = {
                [UTILS_CLOSEST_KEY]: bindArg(ctx, closestForm),
                [UTILS_SELECT_KEY]: selectForms,
                [UTILS_GET_DATA_KEY]: bindArg(ctx, getFormData),
            };
        }
        if (flags[CLICK_TRACKING_FEATURE]) {
            utils['button'] = {
                [UTILS_CLOSEST_KEY]: bindArg(ctx, closestButton),
                [UTILS_SELECT_KEY]: selectButtons,
                [UTILS_GET_DATA_KEY]: bindArg(ctx, getButtonData),
            };
        }
        if (flags[HIDE_PHONES_FEATURE]) {
            utils['phone'] = {
                [UTILS_HIDE_PHONES_KEY]: bindArgs(
                    [ctx, null, [phones]],
                    hidePhones,
                ),
            };
        }
        if (flags[CHECK_STATUS_FEATURE]) {
            utils['status'] = {
                [UTILS_CHECK_STATUS_KEY]: bindArgs(
                    [ctx, parseDecimalInt(counterId)],
                    checkStatusFn,
                ),
            };
        }
        globalConfig.setVal(UTILS_KEY, utils);
    }

    if (src) {
        loadScript(ctx, { src });
    }
};

export const REMOTE_CONTROL_LISTENERS: ((
    ctx: ExtendedWindow,
    event: MessageEvent,
    message: Message,
) => void)[] = [];
export const handleMessage = memo(
    (ctx: ExtendedWindow, event: MessageEvent, message: Message) => {
        const args = [ctx, event, message];
        cForEach(pipe(ctxBindArgs(args), call), REMOTE_CONTROL_LISTENERS);
        if (message['inline']) {
            const src = getResourceUrl(message);
            const { ['data']: data = '', id = '' } = message;
            setupUtilsAndLoadScript(ctx, src, id, data);
        } else if (
            message['resource'] &&
            isAllowedResource(message['resource'])
        ) {
            /* eslint-disable no-underscore-dangle,camelcase */
            ctx['_ym__postMessageEvent'] = event;
            ctx['_ym__inpageMode'] = message['inpageMode'];
            ctx['_ym__initMessage'] = message['initMessage'];
            /* eslint-enable no-underscore-dangle,camelcase */
            buildRemoteIframe(ctx, message['resource']);
        }
    },
    (ctx: ExtendedWindow, event: MessageEvent, message: Message) =>
        message['id'],
);

export const onMessage = (ctx: ExtendedWindow, event: MessageEvent) => {
    let origin: string | undefined;

    try {
        ({ origin } = event);
    } catch {
        // Не всегда есть доступ к origin
    }

    if (!origin) {
        return;
    }

    const isMetrikaOrigin = isAllowedOrigin(origin);

    if (!flags[LOCAL_FEATURE] && !isMetrikaOrigin) {
        return;
    }

    const message: Message = parseJson(ctx, event.data) as Message;
    if (getPath(message, 'action') === 'appendremote') {
        handleMessage(ctx, event, message);
    }
};

/**
 * Run code on page and load scripts based on postMessage
 * Used for demo purposes with connection to Metrica admin panel
 * You can setup goals using this
 * @param ctx - Current window
 */
export const remoteControl = (ctx: ExtendedWindow) => {
    const globalConfig = getGlobalStorage(ctx);

    if (globalConfig.getVal(REMOTE_CONTROL)) {
        return;
    }
    globalConfig.setVal(REMOTE_CONTROL, true);
    const eventSubscriber = cEvent(ctx);
    eventSubscriber.on(ctx, ['message'], bindArg(ctx, onMessage));
};
