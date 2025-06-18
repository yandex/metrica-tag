import { REQUEST_MODE_KEY } from 'src/api/common';
import type {
    CheckTransport,
    InternalTransportOptions,
    TransportResponse,
} from 'src/transport/types';
import { ctxMap } from 'src/utils/array/map';
import type { CounterOptions } from 'src/utils/counterOptions';
import { makeHttpError } from 'src/utils/errorLogger/createError';
import { createKnownError } from 'src/utils/errorLogger/knownError';
import { bindArg, bindArgs } from 'src/utils/function/bind';
import { dirtyPipe } from 'src/utils/function/pipe';
import { parse as parseJSON } from 'src/utils/json';
import { entries, getPath, isFunction, mix } from 'src/utils/object';
import { PolyPromise } from 'src/utils/promise';
import { stringify } from 'src/utils/querystring';
import { addQuery } from 'src/utils/url';
import { WATCH_WMODE_JSON } from '../watchModes';

const CYRILLIC_DOMAIN_REGEXP = /[^a-z0-9.:-]/;

export const SEND_METHOD_NAME = 'send';

const stateChange = (
    ctx: Window,
    xhr: XMLHttpRequest,
    err: Error,
    needResult: boolean | undefined,
    returnRawResponse: boolean | undefined,
    resolve: (s: TransportResponse) => void,
    reject: (s: string | Error) => void,
    r: unknown,
) => {
    if (xhr.readyState === 4) {
        if (xhr.status !== 200 && !returnRawResponse) {
            reject(err);
        }
        if (returnRawResponse) {
            if (xhr.status === 200) {
                resolve(xhr.responseText);
            } else {
                reject(makeHttpError(xhr));
            }
        } else {
            let result = null;
            if (needResult) {
                try {
                    result = parseJSON(
                        ctx,
                        xhr.responseText as string,
                    ) as TransportResponse;
                    if (!result) {
                        reject(err);
                    }
                } catch (e) {
                    reject(err);
                }
            }
            resolve(result);
        }
    }
    return r;
};

const request = (
    ctx: Window,
    url: string,
    opt: InternalTransportOptions,
): Promise<TransportResponse> => {
    const xhr = new ctx.XMLHttpRequest();
    const { rBody } = opt;
    const query = mix(
        opt.wmode
            ? {
                  [REQUEST_MODE_KEY]: WATCH_WMODE_JSON,
              }
            : {},
        opt.rQuery,
    );

    return new PolyPromise((resolve, reject) => {
        xhr.open(opt.verb || 'GET', addQuery(url, stringify(query)), true);
        xhr.withCredentials = !(opt.withCreds === false);
        if (opt.timeOut) {
            xhr.timeout = opt.timeOut;
        }
        dirtyPipe(
            entries,
            ctxMap(([headerName, headerVal]: [string, string]) => {
                xhr.setRequestHeader(headerName, headerVal);
            }),
        )(opt.rHeaders);
        const chFn = bindArgs(
            [
                ctx,
                xhr,
                createKnownError(opt.debugStack),
                opt.wmode,
                opt.returnRawResponse,
                resolve,
                reject,
            ],
            stateChange,
        );
        xhr.onreadystatechange = chFn;

        try {
            xhr.send(rBody);
        } catch {}
    });
};
/*
  Opera 12 sends malformed "origin" on cyrillic hosts, which is why it is sometimes poorly processed.
  And, therefore, the request does not turn out to be cross-domain, and, therefore, the response status turns out to be 0.
  And, therefore, the callback does not work, and, therefore, the request is not deleted from queues for sending.
  And, consequently, the queue is constantly growing, and why do we need it, let it send a picture.
  We don't use {}.toString because sometimes Object.prototype is overridden.
*/
const isOperaXHR = (ctx: Window) => {
    if (
        CYRILLIC_DOMAIN_REGEXP.test(ctx.location.host) &&
        ctx.opera &&
        isFunction(ctx.opera.version)
    ) {
        const operaVersion = ctx.opera.version();
        if (
            typeof operaVersion === 'string' &&
            operaVersion.split('.')[0] === '12'
        ) {
            return true;
        }
    }
    return false;
};

const useXHR: CheckTransport = (
    ctx: Window,
    counterOptions: CounterOptions,
) => {
    if (!getPath(ctx, 'XMLHttpRequest')) {
        return false;
    }

    const xhr = new ctx.XMLHttpRequest();
    if (!('withCredentials' in xhr) || isOperaXHR(ctx)) {
        return false;
    }

    return bindArg(ctx, request);
};

export { useXHR };
