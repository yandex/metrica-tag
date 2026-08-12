import { flags } from '@inject';
import { getSameSiteCookieInfo } from 'src/providers/sameSite';
import { ENABLED_COOKIE_KEY } from 'src/storage/cookie/const';
import { isArray } from 'src/utils/array/isArray';
import { arrayJoin } from 'src/utils/array/join';
import { cForEach } from 'src/utils/array/map';
import { cReduce } from 'src/utils/array/reduce';
import { last } from 'src/utils/array/utils';
import { globalMemoWin } from 'src/utils/function/globalMemo';
import { memo } from 'src/utils/function/memo';
import { getLocation } from 'src/utils/location/location';
import { isNil } from 'src/utils/object';
import { has } from 'src/utils/object/has';
import { safeDecodeURIComponent } from 'src/utils/querystring';
import { trimText } from 'src/utils/string/remove';
import { isCookieAllowed } from './isAllowed';
import type { CookieGetter, CookieStorageGetter } from './types';

export const parseCookie = (ctx: Window) => {
    try {
        const { cookie } = ctx.document;
        if (!isNil(cookie)) {
            const result: Record<string, string | string[]> = {};
            cForEach(
                (part) => {
                    const [name, value] = part.split('=');
                    const cookieName = trimText(name);
                    const cookieValue = trimText(safeDecodeURIComponent(value));
                    if (has(result, cookieName)) {
                        const existing = result[cookieName];
                        if (isArray(existing)) {
                            existing.push(cookieValue);
                        } else {
                            result[cookieName] = [existing, cookieValue];
                        }
                    } else {
                        result[cookieName] = cookieValue;
                    }
                },
                (cookie || '').split(';'),
            );

            return result;
        }
    } catch (e) {
        // Nothing to do
    }
    return null;
};

export const COOKIE_STORAGE_KEY = 'gsc';
export const getCookieState = globalMemoWin(COOKIE_STORAGE_KEY, parseCookie);

export const getCookie: CookieGetter = ((
    ctx: Window,
    name: string,
    multi?: boolean,
) => {
    const state = getCookieState(ctx);
    if (!state || !has(state, name)) {
        return null;
    }

    const value = state[name];
    if (!isArray(value)) {
        return multi ? [value] : value;
    }

    if (multi) {
        return value;
    }

    const lastValue = last(value);
    return isNil(lastValue) ? null : lastValue;
}) as CookieGetter;

const PORT_REGEXP = /:\d+$/;

/**
 * Set cookie for a domain.
 */
export const setCookie = (
    ctx: Window,
    name: string,
    val: string,
    minutes?: number,
    domain?: string,
    path?: string,
    ignoreState = false,
) => {
    if (isCookieAllowed(ctx, getCookie, name)) {
        let cookie = `${name}=${encodeURIComponent(val)};`;
        if (flags.SAME_SITE_FEATURE) {
            cookie += `${getSameSiteCookieInfo(ctx)}`;
        }
        if (minutes) {
            const date = new Date();
            date.setTime(date.getTime() + minutes * 60 * 1000);
            cookie += `expires=${date.toUTCString()};`;
        }
        if (domain) {
            const domainWithoutPort: string = domain.replace(PORT_REGEXP, '');
            cookie += `domain=${domainWithoutPort};`;
        }
        cookie += `path=${path || '/'}`;
        try {
            ctx.document.cookie = cookie;
            if (!ignoreState) {
                const state = getCookieState(ctx);
                if (state) {
                    // The browser may overwrite a cookie (if previous value set from the same domain/path)
                    // or add a duplicate (if previous value set from a parent domain/path).
                    // So refresh from the actual document state.
                    const parsedState = parseCookie(ctx);
                    if (parsedState) {
                        if (has(parsedState, name)) {
                            state[name] = parsedState[name];
                        } else {
                            delete state[name];
                        }
                    }
                }
            }
        } catch (e) {
            // empty
        }
    }
};

function deleteCookie(
    ctx: Window,
    name: string,
    domain?: string,
    path?: string,
    ignoreState = false,
) {
    return setCookie(ctx, name, '', -100, domain, path, ignoreState);
}

export const checkCookie = (ctx: Window, domain?: string, path?: string) => {
    const checkName = ENABLED_COOKIE_KEY;
    setCookie(ctx, checkName, '1', 0, domain, path, true);
    const result = parseCookie(ctx);
    const hasCookie = result && result[ENABLED_COOKIE_KEY];
    if (hasCookie) {
        deleteCookie(ctx, checkName, domain, path, true);
    }
    return !!hasCookie;
};

const SPLITTER = '.';

export const getRootDomain = memo((ctx: Window) => {
    const levels = (getLocation(ctx).host || '').split(SPLITTER);
    if (levels.length === 1) {
        return levels[0];
    }
    return cReduce(
        (input: string, _: string, no: number) => {
            let out = input;
            const currentLevel = no + 1;
            if (currentLevel >= 2 && !out) {
                const domain = arrayJoin(SPLITTER, levels.slice(-currentLevel));
                const res = checkCookie(ctx, domain);
                if (res) {
                    out = domain;
                }
            }
            return out;
        },
        '',
        levels,
    );
});

function cookieStorage(
    ctx: Window,
    prefix = '_ym_',
    namespace: string | number = '',
) {
    const rootDomain = getRootDomain(ctx);
    const fullRootDomain =
        (rootDomain || '').split('.').length === 1
            ? rootDomain
            : `.${rootDomain}`;
    const cookieKey = namespace ? `_${namespace}` : '';
    return {
        delVal(name: string, clientDomain?: string, path?: string) {
            deleteCookie(
                ctx,
                `${prefix}${name}${cookieKey}`,
                clientDomain || fullRootDomain,
                path,
            );
            return this;
        },
        getVal: ((name: string, multi?: boolean) =>
            getCookie(
                ctx,
                `${prefix}${name}${cookieKey}`,
                multi,
            )) as CookieStorageGetter,
        setVal(
            name: string,
            val: string,
            minutes?: number,
            clientDomain?: string,
            path?: string,
        ) {
            setCookie(
                ctx,
                `${prefix}${name}${cookieKey}`,
                val,
                minutes,
                clientDomain || fullRootDomain,
                path,
            );
            return this;
        },
    };
}

export const globalCookieStorage = memo(cookieStorage);

export type CookieStorage = ReturnType<typeof cookieStorage>;

export { cookieStorage, deleteCookie };
