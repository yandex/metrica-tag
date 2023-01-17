import { PREPROD_FEATURE } from 'generated/features';
import { flags } from '@inject';
import { handleError } from './handleError';
import { throwFunction } from './throwFunction';
import { executionTimeErrorDecorator } from './executionTimeErrorDecorator';

/**
 * @param {Object} ctx
 * @param {string} scopeName
 * @param {function(...?): ?} [fn]
 * @param {function (...?): ?} [errorCatch]
 */
export const errorLogger = <FN extends (...args: any) => ReturnType<FN>>(
    ctx: Window,
    scopeName: string,
    fn?: FN,
    defaultReturn?: any,
    callContext?: any,
): FN => {
    const defaultFn: any = throwFunction;
    let callFn = fn || defaultFn;
    if (flags[PREPROD_FEATURE]) {
        callFn = fn
            ? executionTimeErrorDecorator(callFn, scopeName, ctx, callContext)
            : callFn;
    }

    return function logger() {
        let result: any = defaultReturn;
        try {
            // eslint-disable-next-line prefer-rest-params, prefer-spread
            result = callFn!.apply(callContext || null, arguments as any);
        } catch (e) {
            handleError(ctx, scopeName, e as Error);
        }

        return result;
    } as FN;
};

export const ctxErrorLogger = <FN extends (...args: any[]) => any>(
    scope: string,
    fn: FN,
    defaultReturn?: any,
): FN => {
    return function a(this: any) {
        // eslint-disable-next-line prefer-rest-params, prefer-spread
        const ctx: Window = arguments[0];
        return errorLogger(ctx, scope, fn, defaultReturn).apply(
            this,
            // eslint-disable-next-line prefer-rest-params, prefer-spread
            arguments as any,
        );
    } as any;
};
