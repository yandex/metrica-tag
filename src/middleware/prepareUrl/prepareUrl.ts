import { WATCH_URL_PARAM, WATCH_REFERER_PARAM } from 'src/api/watch';
import { getLocation } from 'src/utils/location/location';
import { isString, stringIndexOf } from 'src/utils/string';
import { trimRegexp } from 'src/utils/string/remove';
import { config } from 'src/config';
import { isUndefined } from 'src/utils/object';
import { arrayJoin } from 'src/utils/array/join';
import { MiddlewareGetter } from '../types';

const PROTOCOL_REGEXP = /^[a-z][\w.+-]+:/i;

export const prepare = (ctx: Window, rawUrl?: string): string => {
    const { href, host } = getLocation(ctx);
    let index = -1;
    if (!isString(rawUrl) || isUndefined(rawUrl)) {
        return href;
    }
    const url = rawUrl.replace(trimRegexp, '');
    // Если у url есть протокол, то оставляем как есть
    // важно для целей в том числе
    if (url.search(PROTOCOL_REGEXP) !== -1) {
        return url;
    }
    const firstChar = url.charAt(0);

    if (firstChar === '?') {
        index = href.search(/\?/);
        if (index === -1) {
            return href + url;
        }
    }
    if (firstChar === '#') {
        index = href.search(/#/);
        if (index === -1) {
            return href + url;
        }
    }
    if (index !== -1) {
        return href.substr(0, index) + url;
    }

    if (firstChar === '/') {
        index = stringIndexOf(href, host);
        if (index !== -1) {
            return href.substr(0, index + host.length) + url;
        }
    } else {
        const splitUrl = href.split('/');
        splitUrl[splitUrl.length - 1] = url;
        return arrayJoin('/', splitUrl);
    }
    return '';
};

/**
 * Formats referrer and page url to fit http standard form
 * @param ctx - Current window
 * @param options - Counter options on initialization
 */
export const prepareUrlMiddleware: MiddlewareGetter = (ctx, options) => ({
    beforeRequest: (senderParams, next) => {
        const { brInfo, urlParams } = senderParams;
        if (!brInfo) {
            return next();
        }

        if (!urlParams) {
            return next();
        }

        const referer = urlParams[WATCH_REFERER_PARAM];
        const url = urlParams[WATCH_URL_PARAM];

        if (referer && url !== referer) {
            urlParams[WATCH_REFERER_PARAM] = prepare(ctx, referer);
        } else {
            delete urlParams[WATCH_REFERER_PARAM];
        }

        urlParams[WATCH_URL_PARAM] = prepare(ctx, url).slice(
            0,
            config.MAX_LEN_URL,
        );
        return next();
    },
});
