import { setDeferBase } from 'src/utils/defer/base';
import { errorLogger } from 'src/utils/errorLogger/errorLogger';
import { AnyFunc } from 'src/utils/function/types';
import { getNativeFunction } from '../function/isNativeFunction/getNativeFunction';

export const clearDefer = (ctx: Window, deferId: number) => {
    const clearTimeout: Window['clearTimeout'] = getNativeFunction(
        'clearTimeout',
        ctx,
    );
    // eslint-disable-next-line ban/ban
    return clearTimeout(deferId);
};

export const setDefer = (
    ctx: Window,
    fn: AnyFunc,
    timeOut: number,
    errorScope: string,
) => {
    return setDeferBase(
        ctx,
        errorLogger(ctx, `${errorScope}.d.err`, fn),
        timeOut,
    );
};

export const setDeferInterval = (
    ctx: Window,
    fn: AnyFunc,
    timeOut: number,
    errorScope: string,
) => {
    return ctx.setInterval(
        errorLogger(ctx, `${errorScope}.i.err`, fn),
        timeOut,
    );
};

export const clearDeferInterval = (ctx: Window, deferIntervalId: number) => {
    return ctx.clearInterval(deferIntervalId);
};
