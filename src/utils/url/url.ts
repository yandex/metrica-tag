import { getElemCreateFunction } from 'src/utils/dom';
import { arrayJoin } from '../array';
import { memo } from '../function';
import { stringIncludes } from '../string';

export type UrlInfo = {
    protocol?: string;
    host?: string;
    port?: string;
    hostname?: string;
    hash?: string;
    search?: string;
    query?: string;
    pathname?: string;
    path?: string;
    href?: string;
};

const getUrlParser = memo((ctx: Window) => {
    const createElement = getElemCreateFunction(ctx);
    if (createElement) {
        return createElement('a');
    }
    return undefined;
}) as (ctx: Window) => HTMLAnchorElement | undefined;

export function parseUrl(ctx: Window, url: string): UrlInfo {
    const urlParser = getUrlParser(ctx);
    if (urlParser) {
        urlParser.href = url;
        return {
            protocol: urlParser.protocol,
            host: urlParser.host,
            port: urlParser.port,
            hostname: urlParser.hostname,
            hash: urlParser.hash,
            search: urlParser.search,
            query: urlParser.search.replace(/^\?/, ''),
            pathname: urlParser.pathname || '/', // в ie10 при пустом pathname возвращается '' вместо '/'
            path: (urlParser.pathname || '/') + urlParser.search,
            href: urlParser.href,
        };
    }

    return {};
}

export const getDomain = (url: string) => {
    return (url.split(':')[1] || '')
        .replace(/^\/*/, '')
        .replace(/^www\./, '')
        .split('/')[0];
};

export const isSameDomainInUrls = (url1: string, url2: string) => {
    if (!url1 || !url2) {
        if (!url1 && !url2) {
            // Редкий случай, например в ff - при создании новой вкладки
            return true;
        }

        return false;
    }

    return getDomain(url1) === getDomain(url2);
};

export const addQuery = (
    senderUrl: string,
    query?: string | Uint8Array,
): string => {
    if (!query || !query.length) {
        return senderUrl;
    }
    const [url, ...anchors] = senderUrl.split('#');
    let stringAnchors = arrayJoin('#', anchors);

    stringAnchors = stringAnchors ? `#${stringAnchors}` : '';
    if (stringIncludes(senderUrl, '?')) {
        return `${url}&${query}${stringAnchors}`;
    }
    return `${url}?${query}${stringAnchors}`;
};
