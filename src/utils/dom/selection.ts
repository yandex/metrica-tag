import { bind, call, memo, noop, pipe, toNativeOrFalse } from '../function';

const getSelectFn = memo((ctx: Window) => {
    const nativeSelect = toNativeOrFalse(ctx.getSelection, 'getSelection');
    return nativeSelect ? bind(nativeSelect, ctx) : noop;
});

export const getSelect = pipe(getSelectFn, call);
