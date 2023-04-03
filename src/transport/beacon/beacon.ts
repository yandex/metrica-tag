import { FORCE_URLENCODED_KEY } from 'src/api/common';
import { PolyPromise } from 'src/utils';
import { isAndroidWebView } from 'src/utils/browser';
import { createKnownError } from 'src/utils/errorLogger/knownError';
import { bind, bindArgs, isNativeFunction } from 'src/utils/function';
import { getPath, mix } from 'src/utils/object';
import { stringify } from 'src/utils/querystring';
import {
    CheckTransport,
    InternalTransportOptions,
    TransportFn,
} from '../types';

export const URL_CHAR_LIMIT = 2000;
export const request = (
    ctx: Window,
    senderFn: (urlData: string, postData?: string | Uint8Array) => boolean,
    url: string,
    options: InternalTransportOptions,
) => {
    return new PolyPromise((resolve, reject) => {
        if (!getPath(ctx, 'navigator.onLine')) {
            return reject();
        }
        const query = mix(options.rQuery || {}, {
            [FORCE_URLENCODED_KEY]: 1,
        });

        /**
         * NOTE: In order to avoid unexpected behavior request body is not used.
         * The body size is restricted by design
         * and the limit implementation is browser dependent.
         * Query string proves more reliable.
         * @see https://github.com/w3c/beacon/issues/38
         */
        const fullUrl = `${url}?${stringify(query)}${
            options.rBody ? `&${options.rBody}` : ''
        }`;

        if (fullUrl.length > URL_CHAR_LIMIT) {
            // Query is to long to realistically be passed further
            return reject(createKnownError('sb.tlq'));
        }

        const response = senderFn(fullUrl);

        if (!response) {
            return reject();
        }

        return resolve('');
    });
};

export const useBeaconRaw: CheckTransport = (ctx: Window) => {
    const sender = getPath(ctx, 'navigator.sendBeacon');
    if (sender && isNativeFunction('sendBeacon', sender)) {
        return bindArgs(
            [ctx, bind(sender, getPath(ctx, 'navigator'))],
            request,
        ) as TransportFn;
    }
    return false;
};

export const useBeacon: CheckTransport = (ctx: Window) => {
    return !isAndroidWebView(ctx) && useBeaconRaw(ctx);
};
