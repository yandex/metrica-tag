import { globalCookieStorage } from 'src/storage/cookie';
import { memo } from 'src/utils/function';
import { getLocation } from 'src/utils/location';
import { stringIndexOf } from 'src/utils/string';
import { DEBUG_CTX_FLAG, DEBUG_STORAGE_FLAG, DEBUG_URL_PARAM } from './const';

export const isDebugUrlWithValue = (ctx: Window, value: string) =>
    stringIndexOf(getLocation(ctx).href, `${DEBUG_URL_PARAM}=${value}`) > -1;

export const debugEnabled = memo((ctx: Window) => {
    const cookie = globalCookieStorage(ctx);
    const hasCookieFlag = cookie.getVal(DEBUG_STORAGE_FLAG) === '1';
    const hasUrlFlag =
        isDebugUrlWithValue(ctx, '1') || isDebugUrlWithValue(ctx, '2');
    const hasCtxFlag = ctx[DEBUG_CTX_FLAG];
    const isDebug = hasCtxFlag || hasUrlFlag;
    if (isDebug && !hasCookieFlag) {
        const location = getLocation(ctx);
        cookie.setVal(DEBUG_STORAGE_FLAG, '1', undefined, location.host);
    }
    return !!(hasCookieFlag || hasCtxFlag || hasUrlFlag);
});
