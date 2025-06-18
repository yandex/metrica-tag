import { REQUEST_MODE_KEY } from 'src/api/common';
import type { CounterOptions } from 'src/utils/counterOptions';
import { clearDefer } from 'src/utils/defer/defer';
import { getElemCreateFunction, removeNode } from 'src/utils/dom/dom';
import { createError } from 'src/utils/errorLogger/createError';
import { createKnownError } from 'src/utils/errorLogger/knownError';
import { bindArg, bindArgs } from 'src/utils/function/bind';
import { getRandom } from 'src/utils/number/random';
import { mix } from 'src/utils/object';
import { PolyPromise } from 'src/utils/promise';

import { setDeferBase } from 'src/utils/defer/base';
import { insertScript } from 'src/utils/dom/insertScript';
import { pipe } from 'src/utils/function/pipe';
import type {
    CheckTransport,
    InternalTransportOptions,
    TransportResponse,
} from '../types';
import { WATCH_WMODE_JSONP, getSrcUrl } from '../watchModes';

const DEFAULT_TIMEOUT = 10000;
const WATCH_JSONP_CALLBACK = 'callback';
export const CALLBACK_PREFIX = '_ymjsp';

const delCallback = (ctxAny: any, callbackName: string) => {
    try {
        delete ctxAny[callbackName];
    } catch (e) {
        ctxAny[callbackName] = undefined;
    }
};

const request = (
    ctx: Window,
    senderUrl: string,
    opt: InternalTransportOptions,
) => {
    // eslint-disable-next-line consistent-return
    return new PolyPromise<TransportResponse>((resolve, reject) => {
        const callbackName = `${CALLBACK_PREFIX}${getRandom(ctx)}`;
        const ctxAny = ctx as any;
        const query = mix(
            {
                [WATCH_JSONP_CALLBACK]: callbackName,
            },
            opt.rQuery,
        );
        let script: HTMLScriptElement | undefined;
        const cleanCallback = bindArgs([ctxAny, callbackName], delCallback);
        const callback = (data: TransportResponse) => {
            try {
                cleanCallback();
                removeNode(script!);
                resolve(data);
            } catch (e) {
                reject(e);
            }
        };

        ctxAny[callbackName] = callback;
        query[REQUEST_MODE_KEY] = WATCH_WMODE_JSONP;

        script = insertScript(ctx, {
            ['src']: getSrcUrl(senderUrl, opt, query),
        });

        if (!script) {
            cleanCallback();
            return reject(createError('jp.s'));
        }

        const removeNodeFn = bindArg(script, removeNode);
        const rejectWithError = pipe(
            removeNodeFn,
            bindArg(createKnownError(opt.debugStack), reject),
        );
        const timeout = opt.timeOut || DEFAULT_TIMEOUT;
        const tid = setDeferBase(ctx, rejectWithError, timeout);
        const clearTid: () => void = bindArgs([ctx, tid], clearDefer);

        script.onload = clearTid;

        // на onerror всегда вызываем очистку сами
        script.onerror = pipe(cleanCallback as any, clearTid, rejectWithError);
    });
};

export const useJsonp: CheckTransport = (
    ctx: Window,
    counterOptions: CounterOptions,
) => {
    const createElemFunction = getElemCreateFunction(ctx);
    if (!createElemFunction) {
        return false;
    }
    return bindArg(ctx, request) as (
        senderUrl: string,
        opt: InternalTransportOptions,
    ) => Promise<TransportResponse>;
};
