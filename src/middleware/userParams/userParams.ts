import { MiddlewareGetter } from 'src/middleware/types';
import { getCounterInstance } from 'src/utils/counter/getInstance';
import { METHOD_NAME_USER_PARAMS } from 'src/providers/userParams/const';
import { CounterOptions } from 'src/utils/counterOptions';

declare module 'src/sender/SenderInfo' {
    interface MiddlewareInfo {
        /** User-specified visit parameters */
        userParams?: Record<string, any>;
    }
}

/**
 * Set user-specified visit parameters to request
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 */
export const userParamsMiddleware: MiddlewareGetter = (
    ctx: Window,
    counterOptions: CounterOptions,
) => ({
    afterRequest(senderParams, next) {
        const counterInstance = getCounterInstance(ctx, counterOptions);
        const userParamsFn =
            counterInstance && counterInstance[METHOD_NAME_USER_PARAMS];

        const { userParams } = senderParams.middlewareInfo || {};
        if (userParamsFn && userParams) {
            userParamsFn(userParams);
        }

        next();
    },
});
