import { CounterOptions, getCounterKey } from 'src/utils/counterOptions';
import { ctxErrorLogger } from 'src/utils/errorLogger';
import { getConsole } from 'src/utils/console';
import { METHOD_NAME_PARAMS } from 'src/providers/params/const';
import { getCounterInstance } from 'src/utils/counter';
import { isNumber } from 'src/utils/number';
import { genPath } from 'src/utils/object';
import { isString } from 'src/utils/string';
import { noop } from 'src/utils/function';
import { AnyFunc } from 'src/utils/function/types';
import { METHOD_NAME_SET_USER_ID, SetUserIDHandler } from './const';

export const rawSetUserID = (
    ctx: Window,
    counterOptions: CounterOptions,
): { [METHOD_NAME_SET_USER_ID]: SetUserIDHandler<void> } => {
    return {
        [METHOD_NAME_SET_USER_ID]: (
            id: unknown,
            callback?: AnyFunc,
            callbackCtx?: Window,
        ) => {
            if (!isString(id) && !isNumber(ctx, id)) {
                const ctxConsole = getConsole(
                    ctx,
                    getCounterKey(counterOptions),
                );
                ctxConsole.error('Incorrect user ID');
                return;
            }

            const counterInstance = getCounterInstance(ctx, counterOptions);
            const newData = genPath(['__ym', 'user_id', id]);

            counterInstance![METHOD_NAME_PARAMS]!(
                newData,
                callback || noop,
                callbackCtx,
            );
        },
    };
};

/**
 * Method for transmitting the user ID set by the site owner
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 */
export const setUserID = ctxErrorLogger('suid.int', rawSetUserID);
