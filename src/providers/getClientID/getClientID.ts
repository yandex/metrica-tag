import { callUserCallback } from 'src/utils/function';
import { CounterOptions } from 'src/utils/counterOptions';
import { ctxErrorLogger } from 'src/utils/errorLogger';
import { getUid } from 'src/utils/uid';
import { GetClientIDHandler, METHOD_NAME_GET_CLIENT_ID } from './const';

export const rawGetClientID = (ctx: Window, counterOptions: CounterOptions) => {
    return {
        [METHOD_NAME_GET_CLIENT_ID]: ((callback: (...args: any[]) => any) => {
            const uid = getUid(ctx, counterOptions);

            if (callback) {
                callUserCallback(ctx, callback, null, uid);
            }

            return uid;
        }) as GetClientIDHandler,
    };
};

/**
 * Constructs method for getting the user ID assigned by Metrica
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 */
export const getClientID = ctxErrorLogger('guid.int', rawGetClientID);
