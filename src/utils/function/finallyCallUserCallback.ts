/* eslint-disable */
import { AnyFunc } from './types';
import { bindArgs } from './bind';
import { handleError } from '../errorLogger/handleError';
import { callUserCallback } from './callUserCallback';

export const finallyCallUserCallback = <T>(
    ctx: Window,
    errorNamespace: string,
    promise: Promise<T>,
    callback: AnyFunc,
    userCtx?: any,
) => {
    const userCallback = bindArgs([ctx, callback, userCtx], callUserCallback);

    return promise.then(userCallback, (e) => {
        userCallback();
        handleError(ctx, errorNamespace, e);
    });
};
