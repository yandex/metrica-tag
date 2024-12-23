import { flags } from '@inject';
import { SET_USER_ID_FEATURE, USER_PARAMS_FEATURE } from 'generated/features';
import {
    ARTIFICIAL_BR_KEY,
    PARAMS_BR_KEY,
    WATCH_URL_PARAM,
} from 'src/api/watch';
import { getArtificialState } from 'src/providers/artificialHit/artificialHit';
import { getLoggerFn } from 'src/providers/debugConsole/debugConsole';
import { USER_ID_PARAM } from 'src/providers/setUserID/const';
import { USER_PARAMS_KEY } from 'src/providers/userParams/const';
import { getSender } from 'src/sender';
import { isArray } from 'src/utils/array/isArray';
import { includes } from 'src/utils/array/includes';
import { cReduce } from 'src/utils/array/reduce';
import { browserInfo } from 'src/utils/browserInfo/browserInfo';
import type { CounterOptions } from 'src/utils/counterOptions';
import { ctxErrorLogger } from 'src/utils/errorLogger/errorLogger';
import { noop } from 'src/utils/function/noop';
import { argsToArray } from 'src/utils/function/args';
import { finallyCallUserCallback } from 'src/utils/function/finallyCallUserCallback';
import { isCounterSilent } from 'src/utils/isCounterSilent';
import { getLocation } from 'src/utils/location/location';
import {
    cKeys,
    genPath,
    getPath,
    isFunction,
    isObject,
    mix,
} from 'src/utils/object';
import {
    INTERNAL_PARAMS_KEY,
    METHOD_NAME_PARAMS,
    ParamsHandler,
    PARAMS_PROVIDER,
    YM_LOG_WHITELIST_KEYS,
} from './const';
import {
    PARAMS_CONSOLE_MESSAGE,
    SET_UID_CONSOLE_MESSAGE,
    USER_PARAMS_CONSOLE_MESSAGE,
} from '../consoleRenderer/dictionary';

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

            let shouldLogParams = !isCounterSilent(counterOptions);
            let logMessage = PARAMS_CONSOLE_MESSAGE;
            const logMessageVariables: Record<string, string | number> = {
                ['id']: counterOptions['id'],
            };
            let paramsToLog: Record<string, any> | string | undefined = params;
            let userId = '';

            if (flags[SET_USER_ID_FEATURE]) {
                userId = getPath(
                    params,
                    `${INTERNAL_PARAMS_KEY}.${USER_ID_PARAM}`,
                );
                if (userId) {
                    logMessage = SET_UID_CONSOLE_MESSAGE;
                    logMessageVariables['uid'] = userId;
                }
            }

            if (flags[USER_PARAMS_FEATURE]) {
                const isUser = includes(USER_PARAMS_KEY, cKeys(params));
                if (isUser) {
                    logMessage = USER_PARAMS_CONSOLE_MESSAGE;
                }
            }

            if (paramsToLog[INTERNAL_PARAMS_KEY]) {
                paramsToLog = mix({}, params);
                paramsToLog[INTERNAL_PARAMS_KEY] = cReduce(
                    (result, key) => {
                        const val = getPath(
                            params,
                            `${INTERNAL_PARAMS_KEY}.${key}`,
                        );
                        if (val) {
                            result[key] = val;
                        }

                        return result;
                    },
                    {} as Record<string, unknown>,
                    YM_LOG_WHITELIST_KEYS,
                );
                if (!cKeys(paramsToLog[INTERNAL_PARAMS_KEY]).length) {
                    delete paramsToLog[INTERNAL_PARAMS_KEY];
                }
                shouldLogParams = !!cKeys(paramsToLog).length;
            }

            paramsToLog = !userId ? JSON.stringify(paramsToLog) : undefined;

            const logParams = getLoggerFn(
                ctx,
                counterOptions,
                logMessage,
                logMessageVariables,
                paramsToLog,
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
