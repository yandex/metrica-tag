import { argOptions } from '@inject';
import {
    NOINDEX_BR_KEY,
    IS_DESKTOP_BR_KEY,
    HID_BR_KEY,
    LS_ID_BR_KEY,
    BUILD_FLAGS_BR_KEY,
    REQUEST_NUMBER_BR_KEY,
    BUILD_VERSION_BR_KEY,
    COUNTER_NUMBER_BR_KEY,
    TIMEZONE_BR_KEY,
    TIMESTAMP_BR_KEY,
    SECONDS_BR_KEY,
    COOKIES_ENABLED_BR_KEY,
    RANDOM_NUMBER_BR_KEY,
    VIEWPORT_SIZE_BR_KEY,
    SCREEN_SIZE_BR_KEY,
    DEVICE_PIXEL_RATIO_BR_KEY,
    IS_IFRAME_BR_KEY,
    IS_JAVA_ENABLED_BR_KEY,
    IS_SAME_ORIGIN_AS_TOP_WINDOW_BR_KEY,
    FALSE_URL_BR_KEY,
    NET_TYPE_BR_KEY,
    FIRST_PAINT_BR_KEY,
    DOCUMENT_ENCODING_BR_KEY,
    BROWSER_LANGUAGE_BR_KEY,
    UID_BR_KEY,
    PARENT_HID_BR_KEY,
    NOINDEX_PARAM,
} from 'src/api/watch';
import { toOneOrNull } from 'src/utils/boolean';
import { config } from 'src/config';
import { counterLocalStorage } from 'src/storage/localStorage';
import { arrayJoin } from 'src/utils/array';
import {
    getJavaEnabled,
    getNavigatorLanguage,
    isIframe,
    isTopWindowAccessible,
    netType,
} from 'src/utils/browser';
import { getDocumentEncoding, getViewportSize } from 'src/utils/dom';
import {
    bindArg,
    firstArg,
    FirstArgOfType,
    memo,
    pipe,
    secondArg,
} from 'src/utils/function';
import { isYandexDomain } from 'src/utils/location';
import { getRandom } from 'src/utils/number';
import { ctxPath, getPath } from 'src/utils/object';
import { getMs, TimeOne } from 'src/utils/time';
import { isFalseURL } from './falseUrl';
import { firstPaint } from './firstPaint';
import { getHid } from './hid';
import { getParentHid } from './parentHid';
import { getUidFlag } from './uid';
import { timeZone, timeStamp, timeSeconds } from './timeFlags';
import { LS_ID_KEY, FlagGettersHash } from '../const';
import { numRequests } from './numRequests';
import { getDesktopFlag } from './desktop';
import { getCounterNumber } from './getCounterNumber';

export const BRINFO_FLAG_GETTERS: FlagGettersHash = {
    [BUILD_FLAGS_BR_KEY]: bindArg(
        argOptions.version,
        firstArg as FirstArgOfType<string>,
    ),
    [NET_TYPE_BR_KEY]: netType,
    [FIRST_PAINT_BR_KEY]: firstPaint,
    [FALSE_URL_BR_KEY]: isFalseURL,
    [DOCUMENT_ENCODING_BR_KEY]: getDocumentEncoding,
    [BROWSER_LANGUAGE_BR_KEY]: getNavigatorLanguage,
    [NOINDEX_BR_KEY]: (ctx, options, senderParams) => {
        const { middlewareInfo, urlParams } = senderParams;
        const noIndex = middlewareInfo && middlewareInfo.noIndex;
        if (urlParams && (isYandexDomain(ctx) || options.ut || noIndex)) {
            urlParams[NOINDEX_PARAM] = config.NOINDEX;
        }

        return null;
    },
    [BUILD_VERSION_BR_KEY]: bindArg(
        config.buildVersion,
        firstArg as FirstArgOfType<string>,
    ),
    [COUNTER_NUMBER_BR_KEY]: getCounterNumber,
    [IS_DESKTOP_BR_KEY]: getDesktopFlag,
    [LS_ID_BR_KEY]: memo((ctx, options) => {
        const ls = counterLocalStorage(ctx, options.id);
        const time = TimeOne(ctx);
        const lsId: number | null = ls.getVal(LS_ID_KEY);
        if (!+lsId!) {
            const newLsId = getRandom(ctx, 0, time(getMs));
            ls.setVal<number>(LS_ID_KEY, newLsId);
            return newLsId;
        }

        return lsId;
    }, secondArg),
    [HID_BR_KEY]: getHid,
    [PARENT_HID_BR_KEY]: getParentHid,
    [TIMEZONE_BR_KEY]: timeZone,
    [TIMESTAMP_BR_KEY]: timeStamp,
    [SECONDS_BR_KEY]: timeSeconds,
    [COOKIES_ENABLED_BR_KEY]: pipe(
        ctxPath('navigator.cookieEnabled'),
        toOneOrNull,
    ),
    [RANDOM_NUMBER_BR_KEY]: pipe(firstArg, getRandom),
    [REQUEST_NUMBER_BR_KEY]: numRequests,
    [UID_BR_KEY]: getUidFlag,
    [VIEWPORT_SIZE_BR_KEY]: (ctx: Window) => {
        const [width, height] = getViewportSize(ctx);
        return `${width}x${height}`;
    },
    [SCREEN_SIZE_BR_KEY]: (ctx: Window) => {
        const screen = getPath(ctx, 'screen');
        if (screen) {
            const width = getPath(screen, 'width');
            const height = getPath(screen, 'height');
            const depth =
                getPath(screen, 'colorDepth') || getPath(screen, 'pixelDepth');
            return arrayJoin('x', [width, height, depth]);
        }
        return null;
    },
    [DEVICE_PIXEL_RATIO_BR_KEY]: ctxPath('devicePixelRatio'),
    [IS_IFRAME_BR_KEY]: pipe(isIframe, toOneOrNull),
    [IS_JAVA_ENABLED_BR_KEY]: pipe(getJavaEnabled, toOneOrNull),
    [IS_SAME_ORIGIN_AS_TOP_WINDOW_BR_KEY]: (ctx: Window) => {
        if (isIframe(ctx)) {
            return isTopWindowAccessible(ctx) ? '1' : null;
        }
        return null;
    },
};
