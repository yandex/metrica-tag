import {
    INTERNAL_PARAMS_KEY,
    METHOD_NAME_PARAMS,
} from 'src/providers/params/const';
import { CounterOptions, getCounterKey } from 'src/utils/counterOptions';
import { ctxErrorLogger } from 'src/utils/errorLogger/errorLogger';
import { getCounterInstance } from 'src/utils/counter/getInstance';
import { isNumber } from 'src/utils/number/number';
import { genPath } from 'src/utils/object';
import { isString } from 'src/utils/string';
import { noop } from 'src/utils/function/noop';
import { AnyFunc } from 'src/utils/function/types';
import {
    METHOD_NAME_SET_USER_ID,
    SetUserIDHandler,
    USER_ID_PARAM,
} from './const';
import { DebugConsole } from '../debugConsole/debugConsole';
import { WRONG_USER_ID_CONSOLE_MESSAGE } from '../consoleRenderer/dictionary';

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
                const ctxConsole = DebugConsole(
                    ctx,
                    getCounterKey(counterOptions),
                );
                ctxConsole.error(WRONG_USER_ID_CONSOLE_MESSAGE);
                return;
            }

            const counterInstance = getCounterInstance(ctx, counterOptions);
            const newData = genPath([INTERNAL_PARAMS_KEY, USER_ID_PARAM, id]);

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
