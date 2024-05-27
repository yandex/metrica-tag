import { cForEach } from 'src/utils/array';
import { ctxErrorLogger } from 'src/utils/errorLogger';
import { argOptions } from '@inject';
import { isFunction } from 'src/utils/object';
import { callUserCallback } from 'src/utils/function';
import type { AnyFunc } from 'src/utils/function/types';

export const CALLBACK_ARRAY_NAME = [
    `yandex_metrika_callback${argOptions['callbackPostfix']}`,
    `yandex_metrika_callbacks${argOptions['callbackPostfix']}`,
];

/**
 * Provider to run user defined callbacks
 * @param ctx - Current window
 */
export const callbackInit = ctxErrorLogger('cb.i', (ctx: Window) => {
    const [one, many] = CALLBACK_ARRAY_NAME;
    const anyCtx = ctx as any;
    if (isFunction(anyCtx[one])) {
        anyCtx[one]();
    }
    if (typeof anyCtx[many] === 'object') {
        cForEach((fn: AnyFunc, i) => {
            anyCtx[many][i] = null;
            callUserCallback(ctx, fn);
        }, anyCtx[many]);
    }
    cForEach((callbackName: string) => {
        try {
            delete anyCtx[callbackName];
        } catch (e) {
            anyCtx[callbackName] = undefined;
        }
    }, CALLBACK_ARRAY_NAME);
});
