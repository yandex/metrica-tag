/* eslint-disable */
import { setDeferBase } from 'src/utils/defer/base';
import { AnyFunc, CallUserCallback } from './types';
import { argsToArray } from './args';
import { isFunction, isNil } from '../object/assertions';
import { bindArg } from './bind/bind';
import { throwFunction } from '../errorLogger/throwFunction';

/**
 * запускает неизвестную функцию в try..catch
 * исключение бросает в следующем тике, чтобы не прервать текущий контекст выполнения
 */
export const callUserCallback: CallUserCallback = function z(
    ctx: Window,
    callback?: AnyFunc,
    userContext?: any,
) {
    try {
        if (isFunction(callback)) {
            // eslint-disable-next-line prefer-rest-params
            const [, , , ...args] = argsToArray(arguments);
            callback.apply(isNil(userContext) ? null : userContext, args);
        }
    } catch (error) {
        setDeferBase(ctx, bindArg(error, throwFunction), 0);
    }
};
