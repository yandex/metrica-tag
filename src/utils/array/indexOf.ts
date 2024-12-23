import { flags } from '@inject';
import { POLYFILLS_FEATURE } from 'generated/features';
import { curry2SwapArgs } from '../function/curry';
import { IndexOf } from './types';
import { toNativeOrFalse } from '../function/isNativeFunction/toNativeOrFalse';

const indexOfPoly: IndexOf = (val, array) => {
    for (let i = 0; i < array.length; i += 1) {
        if (array[i] === val) {
            return i;
        }
    }
    return -1;
};

// using the `memo` function is prohibited because it is already used inside the `memo` function
let indexMemo: IndexOf | null;

export const cIndexOf = (ctx: Window) => {
    if (flags[POLYFILLS_FEATURE]) {
        if (indexMemo) {
            return indexMemo;
        }
        let checkIndexFn = false;
        try {
            // Тест для IE 6 или старого safari (никто точно не помнит)
            // eslint-disable-next-line
            checkIndexFn = [].indexOf! && [undefined].indexOf(undefined) === 0;
        } catch {
            // empty
        }
        const isAccessibleArray = ctx.Array && ctx.Array.prototype;
        const nativeFn =
            isAccessibleArray &&
            toNativeOrFalse(ctx.Array.prototype.indexOf, 'indexOf');
        let indexFn: IndexOf;
        if (checkIndexFn && nativeFn) {
            indexFn = <T>(searchValue: T, array: ArrayLike<T>) =>
                nativeFn.call(array, searchValue);
        } else {
            indexFn = indexOfPoly;
        }
        indexMemo = indexFn;
        return indexFn;
    }
    return <T>(searchValue: T, array: ArrayLike<T>) =>
        ctx.Array.prototype.indexOf.call(array, searchValue);
};

export const cIndexOfWin = cIndexOf(window);

export const ctxIndexOf = curry2SwapArgs(cIndexOfWin);
