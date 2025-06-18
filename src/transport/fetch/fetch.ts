import { REQUEST_MODE_KEY } from 'src/api/common';
import type {
    CheckTransport,
    InternalTransportOptions,
    TransportResponse,
} from 'src/transport/types';
import type { CounterOptions } from 'src/utils/counterOptions';
import { setDeferBase } from 'src/utils/defer/base';
import { makeHttpError } from 'src/utils/errorLogger/createError';
import {
    createKnownError,
    throwKnownError,
} from 'src/utils/errorLogger/knownError';
import { throwFunction } from 'src/utils/errorLogger/throwFunction';
import { bindArg, bindArgs } from 'src/utils/function/bind';
import { noop } from 'src/utils/function/noop';
import { getPath, mix } from 'src/utils/object';
import { PolyPromise } from 'src/utils/promise';
import { stringify } from 'src/utils/querystring';
import { addQuery } from 'src/utils/url';
import { WATCH_WMODE_JSON } from '../watchModes';

const request = (
    ctx: Window,
    rawAbortController: AbortController | undefined,
    url: string,
    opt: InternalTransportOptions,
): Promise<TransportResponse> => {
    const query = mix(
        opt.wmode
            ? {
                  [REQUEST_MODE_KEY]: WATCH_WMODE_JSON,
              }
            : {},
        opt.rQuery,
    );
    const abortController = rawAbortController || {
        signal: undefined,
        abort: noop,
    };

    const fetchRequest = ctx.fetch!(addQuery(url, stringify(query)), {
        method: opt.verb,
        body: opt.rBody,
        credentials: opt.withCreds === false ? 'omit' : 'include',
        headers: opt.rHeaders,
        signal: abortController.signal,
    });

    const knownErr = bindArg(opt.debugStack, createKnownError);

    return new PolyPromise((resolve, reject) => {
        if (opt.timeOut) {
            setDeferBase(
                ctx,
                () => {
                    try {
                        abortController.abort();
                    } catch (e) {
                        // empty
                    }
                    reject(knownErr());
                },
                opt.timeOut,
            );
        }
        return fetchRequest
            .then((resp) => {
                if (!resp.ok) {
                    if (!opt.returnRawResponse) {
                        throwKnownError(opt.debugStack);
                    } else {
                        return throwFunction(makeHttpError(resp));
                    }
                }
                if (opt.returnRawResponse) {
                    return resp.text();
                }
                if (opt.wmode) {
                    return resp.json();
                }
                return null;
            })
            .then(resolve)
            .catch(bindArg(knownErr(), reject));
    });
};

const useFetch: CheckTransport = (
    ctx: Window,
    counterOptions: CounterOptions,
) => {
    if (ctx.fetch) {
        const Abort = getPath(ctx, 'AbortController');
        const requestFn = bindArgs(
            [ctx, Abort ? new Abort() : undefined],
            request,
        );
        return requestFn;
    }
    return false;
};

export { useFetch };
