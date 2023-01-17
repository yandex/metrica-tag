import { cReduce, includes } from 'src/utils/array';
import { ENABLED_COOKIE_KEY } from './const';
import { CookieGetter } from './types';

type CookieCheckFunction = (
    ctx: Window,
    getCookie: CookieGetter,
    name?: string,
) => boolean;

export const COOKIES_WHITELIST: string[] = [ENABLED_COOKIE_KEY];
export const COOKIE_CHECK_CALLBACKS: CookieCheckFunction[] = [];

export const isCookieAllowed: CookieCheckFunction = (
    ctx: Window,
    getCookie: CookieGetter,
    name?: string,
) => {
    if (!COOKIE_CHECK_CALLBACKS.length) {
        return true;
    }

    if (includes(name, COOKIES_WHITELIST)) {
        return true;
    }

    return cReduce(
        (result: boolean, callback) => {
            return result && callback(ctx, getCookie, name);
        },
        true,
        COOKIE_CHECK_CALLBACKS,
    );
};
