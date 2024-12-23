import { bind } from '../function/bind/bind';
import { toNativeOrFalse } from '../function/isNativeFunction/toNativeOrFalse';
import { memo } from '../function/memo';
import { noop } from '../function/noop';
import { pipe } from '../function/pipe';
import { call } from '../function/utils';

const getSelectFn = memo((ctx: Window) => {
    const nativeSelect = toNativeOrFalse(ctx.getSelection, 'getSelection');
    return nativeSelect ? bind(nativeSelect, ctx) : noop;
});

export const getSelect = pipe(getSelectFn, call);
