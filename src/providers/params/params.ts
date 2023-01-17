import {
    WATCH_URL_PARAM,
    ARTIFICIAL_BR_KEY,
    PARAMS_BR_KEY,
} from 'src/api/watch';
import type { CounterOptions } from 'src/utils/counterOptions';
import { cReduce, includes, isArray } from 'src/utils/array';
import { noop } from 'src/utils/function';
import { finallyCallUserCallback } from 'src/utils/function/finallyCallUserCallback';
import { getLoggerFn } from 'src/providers/debugConsole/debugConsole';
import { getSender } from 'src/sender';
import { browserInfo } from 'src/utils/browserInfo';
import { getLocation } from 'src/utils/location';
import { ctxErrorLogger } from 'src/utils/errorLogger';
import {
    isFunction,
    genPath,
    getPath,
    cKeys,
    isObject,
    mix,
} from 'src/utils/object';
import { isCounterSilent } from 'src/utils/isCounterSilent';
import { argsToArray } from 'src/utils/function/args';
import { METHOD_NAME_PARAMS, ParamsHandler, PARAMS_PROVIDER } from './const';
import { getArtificialState } from '../artificialHit/artificialHit';

/**
 * Normalized session parameters
 */
export type ParamsOptions = {
    /** Callback context */
    ctxInfo: any;
    /** Function to be called after parameters being sent */
    callback: (...ar: any[]) => any;
    /** The object to be converted to an array of string arrays that correspond to paths in the parameter tree */
    params: Record<string, any>;
};

const YM_LOG_WHITELIST_KEYS = ['ecommerce', 'user_id', 'fpp'];

export const argsToParams = (args: any[]): ParamsOptions | undefined => {
    let callback = noop;
    let ctxInfo: any = null;
    let paramsEnd: number = args.length;

    if (args.length === 0 || !args[0]) {
        return undefined;
    }
    const lastIndex = -1;
    const last = args.slice(lastIndex)[0];
    if (isFunction(last)) {
        callback = last;
        paramsEnd = args.length + lastIndex;
    }
    const prevIndex = -2;
    const beforeLast = args.slice(prevIndex)[0];
    if (isFunction(beforeLast)) {
        callback = beforeLast;
        ctxInfo = last;
        paramsEnd = args.length + prevIndex;
    }
    const params = args.slice(0, paramsEnd);
    return {
        ctxInfo,
        callback,
        params: params.length === 1 ? args[0] : genPath(params),
    };
};

/**
 * This method accepts data in two ways:
 * 1. var yaParam = {param1: {param2: 'param3'}};
 * yaCounter123.params(param[, callback[, ctx]]); // One parameter is a JSON object
 *
 * 2. yaCounter123.params(level1, [level2], [level3], [...], value[, callback[, ctx]]);
 * Two or more parameters, the first and the following are categories (string). The last argument is a value (any type).
 * This method is suitable for dynamic categories. For example, for the error log:
 * yaCounter123.params('{url}', '{os}', '{browser}', '{error}');
 */

export const rawParams = (
    ctx: Window,
    counterOptions: CounterOptions,
): { [METHOD_NAME_PARAMS]: ParamsHandler } => {
    return {
        [METHOD_NAME_PARAMS]: function a() {
            // eslint-disable-next-line prefer-rest-params
            const args = argsToArray(arguments);

            const info = argsToParams(args);
            if (!info) {
                return null;
            }
            const { ctxInfo, params, callback } = info;
            if (!isObject<Record<string, any>>(params) && !isArray(params)) {
                return null;
            }
            const sender = getSender(ctx, PARAMS_PROVIDER, counterOptions);
            const { url } = getArtificialState(counterOptions);

            const userId = getPath(params, '__ym.user_id');
            const paramKeys = cKeys(params);

            const isUser = includes('__ymu', paramKeys);
            const isUserID = includes('__ym', paramKeys) && userId;

            let shouldLogParams = !isCounterSilent(counterOptions);
            let paramsToLog: any = params;
            if (paramsToLog['__ym']) {
                paramsToLog = mix({}, params);
                paramsToLog['__ym'] = cReduce(
                    (result, key) => {
                        const val = getPath(params, `__ym.${key}`);
                        if (val) {
                            result[key] = val;
                        }

                        return result;
                    },
                    {} as any,
                    YM_LOG_WHITELIST_KEYS,
                );
                if (!cKeys(paramsToLog['__ym']).length) {
                    delete paramsToLog['__ym'];
                }
                shouldLogParams = !!cKeys(paramsToLog).length;
            }

            const logParams = getLoggerFn(
                ctx,
                counterOptions,
                isUserID
                    ? `Set user id ${userId}`
                    : `${isUser ? 'User p' : 'P'}arams. Counter ${
                          counterOptions['id']
                      }`,
                !isUserID ? JSON.stringify(paramsToLog) : undefined,
            );

            const result = sender(
                {
                    middlewareInfo: {
                        params,
                    },
                    brInfo: browserInfo({
                        [PARAMS_BR_KEY]: 1,
                        [ARTIFICIAL_BR_KEY]: 1,
                    }),
                    urlParams: {
                        [WATCH_URL_PARAM]: url || getLocation(ctx).href,
                    },
                },
                counterOptions,
            ).then(shouldLogParams ? logParams : noop);

            return finallyCallUserCallback(
                ctx,
                'p.s',
                result,
                callback,
                ctxInfo,
            );
        },
    };
};

/**
 * The session parameters lets you specify additional user information you wish to track
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 */
export const useParams = ctxErrorLogger('pa.int', rawParams);
