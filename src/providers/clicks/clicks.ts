import {
    WATCH_URL_PARAM,
    WATCH_REFERER_PARAM,
    IS_DOWNLOAD_BR_KEY,
    IS_EXTERNAL_LINK_BR_KEY,
    IS_TRUSTED_EVENT_BR_KEY,
} from 'src/api/watch';
import { hasClass } from 'src/utils/dom/dom';
import { getGlobalStorage } from 'src/storage/global/getGlobal';
import { escapeForRegExp, isString } from 'src/utils/string';
import { trimText } from 'src/utils/string/remove';
import { ctxPath, getPath } from 'src/utils/object';
import { noop } from 'src/utils/function/noop';
import { finallyCallUserCallback } from 'src/utils/function/finallyCallUserCallback';
import {
    CounterOptions,
    RawTrackLinkParams,
    getCounterKey,
} from 'src/utils/counterOptions';
import { getSender } from 'src/sender';
import { getLocation, isSameDomain } from 'src/utils/location/location';
import { parseUrl } from 'src/utils/url';
import { arrayJoin } from 'src/utils/array/join';
import { cMap, cForEach } from 'src/utils/array/map';
import { UNSUBSCRIBE_PROPERTY } from 'src/providers';

import { counterLocalStorage } from 'src/storage/localStorage/localStorage';
import { cEvent } from 'src/utils/events/events';
import { browserInfo } from 'src/utils/browserInfo/browserInfo';
import { SenderInfo } from 'src/sender/SenderInfo';
import { errorLogger } from 'src/utils/errorLogger/errorLogger';
import { getHid } from 'src/middleware/watchSyncFlags/brinfoFlags/hid';
import {
    counterStateGetter,
    counterStateSetter,
} from 'src/providers/getCounters/getCounters';
import { COUNTER_STATE_TRACK_LINKS } from 'src/providers/getCounters/const';
import {
    DebugConsole,
    getLoggerFn,
} from 'src/providers/debugConsole/debugConsole';
import { flags } from '@inject';
import { DEBUG_EVENTS_FEATURE } from 'generated/features';
import { toZeroOrOne } from 'src/utils/boolean';
import { dispatchDebuggerEvent } from 'src/utils/debugEvents';
import { getTargetLink } from 'src/utils/dom/targetLink';
import { curry2 } from 'src/utils/function/curry';
import { pipe } from 'src/utils/function/pipe';
import { firstArg } from 'src/utils/function/identity';
import {
    bindArg,
    bindArgs,
    bindThisForMethod,
} from 'src/utils/function/bind/bind';
import { CallWithoutArguments, call } from 'src/utils/function/utils';
import {
    EMPTY_LINK_CONSOLE_MESSAGE,
    LINK_CLICK_CONSOLE_MESSAGE,
} from '../consoleRenderer/dictionary';
import { textFromLink } from './getTextFromLink';
import type {
    SendOptions,
    ClickHandlerOptions,
    ClickProviderParams,
    UserOptions,
    TrackLinks,
    ExternalLinkClickHandler,
    AddFileExtensionHandler,
} from './types';
import {
    INTERNAL_LINK_STORAGE_KEY,
    MAX_LEN_INTERNAL_LINK,
    REG_DOWNLOAD,
    BAD_PROTOCOL_RE,
    METHOD_NAME_EXTERNAL_LINK_CLICK,
    METHOD_NAME_ADD_FILE_EXTENSION,
    METHOD_NAME_FILE_CLICK,
    METHOD_NAME_TRACK_LINKS,
    LINK_CLICK_HIT_PROVIDER,
} from './const';

declare module 'src/sender/SenderInfo' {
    interface MiddlewareInfo {
        /** Deprecated flag for backend */
        noIndex?: boolean;
    }
}

export const setShouldTrack = (
    setVal: ReturnType<typeof counterStateSetter>,
    rawParams: RawTrackLinkParams,
) => {
    const overrides: Partial<Record<string, boolean>> = {
        ['string']: true,
        ['object']: true,
        ['boolean']: rawParams as boolean,
    };
    const shouldTrack = overrides[typeof rawParams] || false; // По-умолчанию трекинг ссылок отключен;
    setVal({
        [COUNTER_STATE_TRACK_LINKS]: shouldTrack,
    });
};

export const sendClickLink = (
    ctx: Window,
    counterOptions: CounterOptions,
    options: SendOptions,
) => {
    const brInfo = browserInfo();

    if (options.isTrustedEvent !== undefined) {
        brInfo.setVal(
            IS_TRUSTED_EVENT_BR_KEY,
            toZeroOrOne(options.isTrustedEvent),
        );
    }

    if (options.isDownload) {
        brInfo.setVal(IS_DOWNLOAD_BR_KEY, 1);
    }

    if (options.isExternalLink) {
        brInfo.setVal(IS_EXTERNAL_LINK_BR_KEY, 1);
    }

    const userOptions = options.userOptions || {};

    const senderInfo: SenderInfo = {
        brInfo,
        middlewareInfo: {
            title: userOptions['title'] || options.title,
            noIndex: !!options.noIndex,
            params: userOptions['params'],
        },
        urlParams: {
            [WATCH_URL_PARAM]: options.url,
            [WATCH_REFERER_PARAM]:
                counterOptions.forceUrl || getLocation(ctx).href,
        },
    };

    let prefix = 'Link';

    if (options.isDownload) {
        prefix = options.isExternalLink ? 'Ext link - File' : 'File';
    } else if (options.isExternalLink) {
        prefix = 'Ext link';
    }

    if (flags[DEBUG_EVENTS_FEATURE]) {
        dispatchDebuggerEvent(ctx, {
            ['counterKey']: getCounterKey(counterOptions),
            ['name']: 'event',
            ['data']: {
                ['schema']: 'Link click',
                ['name']: `${
                    options.isExternalLink ? 'external' : 'internal'
                } url: ${options.url}`,
            },
        });
    }

    const result = options.sender(senderInfo, counterOptions).then(
        getLoggerFn(
            ctx,
            counterOptions,
            LINK_CLICK_CONSOLE_MESSAGE,
            {
                ['prefix']: prefix,
                ['id']: counterOptions.id,
                ['url']: options.url,
            },
            options.userOptions,
        ),
    );

    return finallyCallUserCallback(
        ctx,
        'cl.p.s',
        result,
        userOptions['callback'] || noop,
        userOptions['ctx'],
    );
};

export const handleClickEventRaw = (
    options: ClickHandlerOptions,
    event: MouseEvent,
) => {
    if (!options.trackLinksEnabled()) {
        return;
    }

    const target = getTargetLink(event);

    if (!target) {
        return;
    }

    if (hasClass('ym-disable-tracklink', target)) {
        return;
    }

    const {
        ctx,
        counterLocalStorage: incomingCounterLocalStorage,
        counterOptions,
        sender,
        fileExtensions,
    } = options;
    const { forceUrl } = counterOptions;

    const targetHref = target.href;
    let title = textFromLink(target);
    title = targetHref === title ? '' : title;
    const isTrustedEvent = getPath(event, 'isTrusted')!;

    if (hasClass('ym-external-link', target)) {
        sendClickLink(ctx, counterOptions, {
            url: targetHref,
            isExternalLink: true,
            title,
            isTrustedEvent,
            sender,
        });
        return;
    }

    const domain = forceUrl
        ? parseUrl(ctx, forceUrl).hostname
        : getLocation(ctx).hostname;

    const userFileRegex = RegExp(
        `\\.(${arrayJoin('|', cMap(escapeForRegExp, fileExtensions))})$`,
        'i',
    );

    const file = `${target.protocol}//${target.hostname}${target.pathname}`;

    /*
        Supported URL formats:
        http://example.com/dir/music.mp3
        http://example.com/dir/music.mp3?item1=1234567
        http://example.com/dir/?item=1234567&file=music.mp3
    */
    const isDownload =
        REG_DOWNLOAD.test(file) ||
        REG_DOWNLOAD.test(targetHref) ||
        userFileRegex.test(targetHref) ||
        userFileRegex.test(file);

    if (isSameDomain(domain!, target.hostname)) {
        // Internal link
        if (isDownload) {
            // File download
            sendClickLink(ctx, counterOptions, {
                url: targetHref,
                isDownload: true,
                isTrustedEvent,
                title,
                sender,
            });
        } else if (title) {
            incomingCounterLocalStorage.setVal(
                INTERNAL_LINK_STORAGE_KEY,
                trimText(title).slice(0, MAX_LEN_INTERNAL_LINK),
            );
        }
    } else {
        // External link
        if (targetHref && BAD_PROTOCOL_RE.test(targetHref)) {
            return;
        }

        sendClickLink(ctx, counterOptions, {
            url: targetHref,
            noIndex: true,
            isExternalLink: true,
            isDownload,
            isTrustedEvent,
            title,
            sender,
        });
    }
};

export const addFileExtensionFn = curry2(
    (fileExtensions: string[], ext: string | string[]) => {
        if (isString(ext)) {
            fileExtensions.push(ext);
        } else {
            cForEach(
                pipe(firstArg, bindThisForMethod('push', fileExtensions)),
                ext,
            );
        }
    },
);

/**
 * Track clicks, link navigations and file downloads
 * - NOTE: To activate use `counterOptions.trackLinks` option
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 */
export const useClicksProvider = (
    ctx: Window,
    counterOptions: CounterOptions,
): ClickProviderParams => {
    const sender = getSender(ctx, LINK_CLICK_HIT_PROVIDER, counterOptions);
    const fileExtensions: string[] = [];
    const counterKey = getCounterKey(counterOptions);
    const ctxConsole = DebugConsole(ctx, counterKey);

    const trackLinks: TrackLinks = errorLogger(
        ctx,
        's.s.tr',
        bindArg(counterStateSetter(ctx, counterKey), setShouldTrack),
    );

    const clickHandlerOptions: ClickHandlerOptions = {
        ctx,
        counterOptions,
        fileExtensions,
        sender,
        globalStorage: getGlobalStorage(ctx),
        counterLocalStorage: counterLocalStorage(ctx, counterOptions.id),
        hitId: getHid(ctx),
        trackLinksEnabled: bindArg(
            bindArg(counterKey, counterStateGetter(ctx)),
            pipe(
                call as CallWithoutArguments,
                ctxPath(COUNTER_STATE_TRACK_LINKS),
            ),
        ) as unknown as () => boolean,
    };

    const handleClickEvent = errorLogger(
        ctx,
        'cl.p.c',
        bindArg(clickHandlerOptions, handleClickEventRaw),
    );

    const eventHandler = cEvent(ctx);
    const destroy = eventHandler.on(ctx, ['click'], handleClickEvent);

    const counterMethod = (
        isDownload: boolean,
        noIndex: boolean,
        url: string,
        userOptions: UserOptions = {},
    ) => {
        if (url) {
            sendClickLink(ctx, counterOptions, {
                url,
                isExternalLink: true,
                isDownload,
                noIndex,
                sender,
                userOptions,
            });
        } else {
            ctxConsole.warn(EMPTY_LINK_CONSOLE_MESSAGE);
        }
    };

    if (counterOptions.trackLinks) {
        trackLinks(counterOptions.trackLinks);
    }

    const file: ClickProviderParams['file'] = errorLogger(
        ctx,
        'file.clc',
        bindArgs([true, false], counterMethod),
    );
    const extLink: ExternalLinkClickHandler = errorLogger(
        ctx,
        'e.l.l.clc',
        bindArgs([false, true], counterMethod),
    );
    const addFileExtension: AddFileExtensionHandler = errorLogger(
        ctx,
        'add.f.e.clc',
        addFileExtensionFn(fileExtensions),
    );

    return {
        [METHOD_NAME_FILE_CLICK]: file,
        [METHOD_NAME_EXTERNAL_LINK_CLICK]: extLink,
        [METHOD_NAME_ADD_FILE_EXTENSION]: addFileExtension,
        [METHOD_NAME_TRACK_LINKS]: trackLinks,
        [UNSUBSCRIBE_PROPERTY]: destroy,
    };
};
