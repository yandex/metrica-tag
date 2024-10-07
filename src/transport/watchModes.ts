import { stringify } from 'src/utils/querystring';
import { addQuery } from 'src/utils/url';
import { TransportOptions } from './types';

export const WATCH_WMODE_JSON = '7';
export const WATCH_WMODE_JSONP = '5';
export const WATCH_WMODE_IMAGE = '0';

/**
 * Moves the body of the POST request to the arguments of the GET request
 * for transports that cannot transmit the request body, e.g. beacon
 */
export const getSrcUrl = (
    senderUrl: string,
    opt: TransportOptions,
    query: Record<string, string>,
) => {
    let resultUrl = senderUrl;
    const stringifiedQuery = stringify(query);

    if (stringifiedQuery) {
        resultUrl = addQuery(resultUrl, stringifiedQuery);
    }

    if (opt.rBody) {
        resultUrl = addQuery(resultUrl, opt.rBody);
    }
    return resultUrl;
};
