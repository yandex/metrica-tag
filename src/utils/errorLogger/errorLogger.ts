import { flags } from '@inject';
import { AnyFunc } from 'src/utils/function/types';
import { handleError } from './handleError';
import { throwFunction } from './throwFunction';
import { executionTimeErrorDecorator } from './executionTimeErrorDecorator';

/**
 * @param extraTimingFlag — opt-in for collecting execution-time metrics for a specific
 * scope when PREPROD_FEATURE / EXPERIMENTAL_FEATURE are disabled.
 */
export const errorLogger = <FN extends (...args: any) => ReturnType<FN>>(
    ctx: Window,
    scopeName: string,
    fn?: FN,
    defaultReturn?: any,
    callContext?: any,
    extraTimingFlag?: boolean,
): FN => {
    const defaultFn: any = throwFunction;
    let callFn = fn || defaultFn;

    if (fn && (flags.EXPERIMENTAL_FEATURE || extraTimingFlag)) {
        callFn = executionTimeErrorDecorator(
            callFn,
            scopeName,
            ctx,
            callContext,
        );
    }

    return function logger() {
        let result: any = defaultReturn;
        try {
            result = callFn!.apply(callContext || null, arguments);
        } catch (e) {
            handleError(ctx, scopeName, e as Error);
        }

        return result;
    } as FN;
};

export const ctxErrorLogger = <FN extends AnyFunc>(
    scope: string,
    fn: FN,
    defaultReturn?: any,
): FN => {
    return function a(this: any) {
        const ctx: Window = arguments[0];
        return errorLogger(ctx, scope, fn, defaultReturn).apply(
            this,

            arguments as any,
        );
    } as any;
};
