import { FORCE_URLENCODED_KEY } from 'src/api/common';
import { isAndroidWebView } from 'src/utils/browser/browser';
import type { CounterOptions } from 'src/utils/counterOptions';
import { createKnownError } from 'src/utils/errorLogger/knownError';
import { bind, bindArgs } from 'src/utils/function/bind';
import { isNativeFunction } from 'src/utils/function/isNativeFunction/isNativeFunction';
import { getPath, mix } from 'src/utils/object';
import { PolyPromise } from 'src/utils/promise';
import { stringify } from 'src/utils/querystring';
import type {
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
        const query = mix(options.rQuery!, {
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

export const useBeaconRaw: CheckTransport = (
    ctx: Window,
    counterOptions: CounterOptions,
) => {
    const sender = getPath(ctx, 'navigator.sendBeacon');
    if (sender && isNativeFunction('sendBeacon', sender)) {
        return bindArgs(
            [ctx, bind(sender, getPath(ctx, 'navigator'))],
            request,
        ) as TransportFn;
    }
    return false;
};

export const useBeacon: CheckTransport = (
    ctx: Window,
    counterOptions: CounterOptions,
) => {
    // If Android WebView, don't use beacon transport
    if (isAndroidWebView(ctx)) {
        return false;
    }

    // Pass counterOptions to useBeaconRaw
    return useBeaconRaw(ctx, counterOptions);
};
