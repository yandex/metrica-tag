import { errorLogger } from 'src/utils/errorLogger';
import { setDeferBase } from 'src/utils/defer/base';

const SCOPE_KEY = 'def';

export const setDefer = (
    ctx: Window,
    fn: (...args: any[]) => any,
    timeOut: number,
    errorScope?: string,
) => {
    return setDeferBase(
        ctx,
        errorLogger(ctx, `d.err.${errorScope || SCOPE_KEY}`, fn),
        timeOut,
    );
};

export const setDeferInterval = (
    ctx: Window,
    fn: (...args: any[]) => any,
    timeOut: number,
    errorScope?: string,
) => {
    return ctx.setInterval(
        errorLogger(ctx, `i.err.${errorScope || SCOPE_KEY}`, fn),
        timeOut,
    );
};

export const clearDeferInterval = (ctx: Window, deferIntervalId: number) => {
    return ctx.clearInterval(deferIntervalId);
};
