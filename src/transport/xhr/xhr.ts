import { REQUEST_MODE_KEY } from 'src/api/common';
import { entries, mix, isFunction, getPath } from 'src/utils/object';
import { PolyPromise } from 'src/utils';
import { dirtyPipe, bindArgs, bindArg } from 'src/utils/function';
import {
    InternalTransportOptions,
    CheckTransport,
    TransportResponse,
} from 'src/transport/types';
import { createKnownError } from 'src/utils/errorLogger/knownError';
import { stringify } from 'src/utils/querystring';
import { parse as parseJSON } from 'src/utils/json';
import { ctxMap } from 'src/utils/array';
import { makeHttpError } from 'src/utils/errorLogger/createError';
import { WATCH_WMODE_JSON } from '../watchModes';

const CYRILLIC_DOMAIN_REGEXP = /[^a-z0-9.:-]/;

export const SEND_METHOD_NAME = 'send';

const stateChange = (
    ctx: Window,
    xhr: XMLHttpRequest,
    err: Error,
    needResult: boolean,
    returnRawResponse: boolean,
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
        xhr.open(opt.verb || 'GET', `${url}?${stringify(query)}`, true);
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
// Opera12 криво посылает заголовок Origin на кириллических хостах, отчего БК не присылает его обратно.
// И, следовательно, запрос не получается кроссдоменным, и, следовательно, статус ответа получается 0,
// и, следовательно, не срабатывает колбек, и, следовательно, не удаляется запрос из очереди на отправку,
// и, следовательно, очередь постоянно растёт, а зачем нам это надо, пусть отправляет картинкой.
// {}.toString из-за всяких мудаков, переопределяющих Object.prototype, не используем.
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

const useXHR: CheckTransport = (ctx: Window) => {
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
