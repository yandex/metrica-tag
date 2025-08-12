import { parse as parseJson } from 'src/utils/json';
import { getElemCreateFunction, getRootElement } from 'src/utils/dom/dom';
import { getGlobalStorage } from 'src/storage/global/getGlobal';
import { memo } from 'src/utils/function/memo';
import { getPath } from 'src/utils/object';
import { cEvent } from 'src/utils/events/events';
import { flags } from '@inject';
import { includes } from 'src/utils/array/includes';
import { cFilter } from 'src/utils/array/filter';
import { arrayJoin } from 'src/utils/array/join';
import { cForEach, cMap } from 'src/utils/array/map';
import {
    closestButton,
    getButtonData,
    selectButtons,
} from 'src/utils/dom/button';
import { closestForm, getFormData, selectForms } from 'src/utils/dom/form';
import { checkStatusFn } from 'src/providers/statusCheck/statusCheckFn';
import { isNumber, parseDecimalInt } from 'src/utils/number/number';
import { AnyFunc } from 'src/utils/function/types';
import {
    getClosestTextContainer,
    getTextContainerData,
    selectTextContainer,
} from 'src/utils/dom/block';
import { insertScript } from 'src/utils/dom/insertScript';
import { getCachedTags } from 'src/utils/dom/element';
import { curry2 } from 'src/utils/function/curry';
import { pipe } from 'src/utils/function/pipe';
import { firstArg } from 'src/utils/function/identity';
import {
    bindArg,
    bindArgs,
    bindThisForMethodTest,
} from 'src/utils/function/bind/bind';
import { ctxBindArgs } from 'src/utils/function/bind/ctxBind';
import { call } from 'src/utils/function/utils';

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
    const iframeContainer = createElement('div') as HTMLDivElement & {
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

        insertScript(iframeEl.contentWindow as Window, { src });
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

const webvisorRegex = /^http:\/\/([\w\-.]+\.)?webvisor\.com\/?$/;
const metrikaRegex =
    /^https:\/\/([\w\-.]+\.)?metri[kc]a\.yandex\.(ru|by|uz|kz|com|com\.tr)\/?$/;
export const isAllowedOrigin = (origin: string) =>
    webvisorRegex.test(origin) || metrikaRegex.test(origin);

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
    /** Are block utils needed */
    isBlockUtilsEnabled?: boolean;
} & InlineMessageProps;

export const UTILS_KEY = '_u';
export const UTILS_CLOSEST_KEY = 'closest';
export const UTILS_SELECT_KEY = 'select';
export const UTILS_GET_DATA_KEY = 'getData';

export const UTILS_CHECK_STATUS_KEY = 'checkStatus';

const SPLITTER = '.';
const AVAILABLE_FILES = ['form', 'button', 'status'];

const BETA_URL = 'https://s3.mds.yandex.net/internal-metrika-betas';
const MAIN_URL = 'https://yastatic.net/s3/metrika';

export const getResourceUrl = (
    ctx: Window,
    message: InlineMessageProps,
): string => {
    const {
        ['lang']: lang = '',
        ['appVersion']: appVersion = '',
        ['fileId']: fileId = '',
        ['beta']: beta = false,
    } = message;
    const validVersion = arrayJoin(
        SPLITTER,
        cFilter(
            curry2(isNumber)(ctx),
            cMap(pipe(firstArg, parseDecimalInt), appVersion.split(SPLITTER)),
        ),
    );

    if (
        !includes(fileId, AVAILABLE_FILES) ||
        !includes(lang, ['ru', 'en', 'tr'])
    ) {
        return '';
    }

    const baseUrl = beta ? BETA_URL : MAIN_URL;
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
    isBlockUtilsEnabled?: boolean,
) => {
    if (
        flags.CLICK_TRACKING_FEATURE ||
        flags.SUBMIT_TRACKING_FEATURE ||
        flags.REMOTE_CONTROL_FEATURE ||
        flags.CHECK_STATUS_FEATURE
    ) {
        const globalConfig = getGlobalStorage(ctx);
        const utils: Record<
            string,
            typeof getCachedTags | Record<string, AnyFunc>
        > = {};

        utils['getCachedTags'] = getCachedTags;
        if (flags.SUBMIT_TRACKING_FEATURE || flags.REMOTE_CONTROL_FEATURE) {
            utils['form'] = {
                [UTILS_CLOSEST_KEY]: bindArg(ctx, closestForm),
                [UTILS_SELECT_KEY]: selectForms,
                [UTILS_GET_DATA_KEY]: bindArg(ctx, getFormData),
            };
        }
        if (
            flags.REMOTE_CONTROL_BLOCK_HELPERS_FEATURE &&
            (flags.REMOTE_CONTROL_FEATURE ||
                flags.CLICK_TRACKING_FEATURE ||
                flags.SUBMIT_TRACKING_FEATURE) &&
            isBlockUtilsEnabled
        ) {
            utils['block'] = {
                [UTILS_CLOSEST_KEY]: bindArg(ctx, getClosestTextContainer),
                [UTILS_SELECT_KEY]: selectTextContainer,
                [UTILS_GET_DATA_KEY]: bindArg(ctx, getTextContainerData),
            };
        }
        if (flags.CLICK_TRACKING_FEATURE || flags.REMOTE_CONTROL_FEATURE) {
            utils['button'] = {
                [UTILS_CLOSEST_KEY]: bindArg(ctx, closestButton),
                [UTILS_SELECT_KEY]: selectButtons,
                [UTILS_GET_DATA_KEY]: bindArg(ctx, getButtonData),
            };
        }
        if (flags.CHECK_STATUS_FEATURE) {
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
        insertScript(ctx, { src });
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
            const src = getResourceUrl(ctx, message);
            const { id = '' } = message;
            setupUtilsAndLoadScript(
                ctx,
                src,
                id,
                message['isBlockUtilsEnabled'],
            );
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
    // Не всегда есть доступ к origin
    const origin = getPath(event, 'origin');

    if (!origin) {
        return;
    }

    const isMetrikaOrigin = isAllowedOrigin(origin);

    if (!flags.LOCAL_FEATURE && !isMetrikaOrigin) {
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
