import { stringify } from 'src/utils/querystring';
import { TransportOptions } from './types';

export const WATCH_WMODE_JSON = '7';
export const WATCH_WMODE_JSONP = '5';
export const WATCH_WMODE_IMAGE = '0';

// переносим тело POST запроса в арументы GET запроса
// для транспортов которые не умеют тело запроса
export const getSrcUrl = (
    senderUrl: string,
    opt: TransportOptions,
    query: Record<string, string>,
) => {
    let resultUrl = senderUrl;
    const stringifiedQuery = stringify(query);

    if (stringifiedQuery) {
        resultUrl += `?${stringifiedQuery}`;
    }

    if (opt.rBody) {
        resultUrl += `${stringifiedQuery ? '&' : '?'}${opt.rBody}`;
    }
    return resultUrl;
};
