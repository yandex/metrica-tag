import { CounterOptions, getCounterKey } from 'src/utils/counterOptions';
import { errorLogger, ctxErrorLogger } from 'src/utils/errorLogger';
import { METHOD_NAME_PARAMS } from 'src/providers/params/const';
import { getCounterInstance } from 'src/utils/counter';
import { DebugConsole } from 'src/providers/debugConsole/debugConsole';
import { isObject } from 'src/utils/object';
import { noop } from 'src/utils/function';
import { METHOD_NAME_USER_PARAMS, USER_PARAMS_KEY } from './const';
import { UserParamsHandler } from './types';

export const rawUserParams = (
    ctx: Window,
    counterOptions: CounterOptions,
): { [METHOD_NAME_USER_PARAMS]: UserParamsHandler } => {
    return {
        [METHOD_NAME_USER_PARAMS]: errorLogger(
            ctx,
            'up.c',
            function a(
                data: any,
                callback?: (...args: any[]) => any,
                callbackCtx?: Window,
            ) {
                const counterInstance = getCounterInstance(ctx, counterOptions);
                const { warn } = DebugConsole(
                    ctx,
                    getCounterKey(counterOptions),
                );

                if (!counterInstance) {
                    warn('No counter instance found');
                    return;
                }

                if (!isObject(data)) {
                    warn('Wrong user params');
                    return;
                }

                const newData = {
                    [USER_PARAMS_KEY]: data,
                };
                const userParamsFn = counterInstance[METHOD_NAME_PARAMS];

                if (userParamsFn) {
                    userParamsFn(newData, callback || noop, callbackCtx);
                }
            },
        ),
    };
};

/**
 * Method for transmitting user parameters
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 */
export const userParams = ctxErrorLogger('up.int', rawUserParams);
