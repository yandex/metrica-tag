import { toNativeOrFalse } from 'src/utils/function/isNativeFunction/toNativeOrFalse';
import { curry2SwapArgs } from '../function/curry';

type IndexFn = <E>(val: E, array: E[]) => number;

const indexOfPoly: IndexFn = (val, array) => {
    for (let i = 0; i < array.length; i += 1) {
        if (array[i] === val) {
            return i;
        }
    }
    return -1;
};

// тут нельзя использовать memo так как memo использует эту функцию
let indexMemo: IndexFn | null;

export const cIndexOf = (ctx: Window) => {
    if (indexMemo) {
        return indexMemo;
    }
    let checkIndexFn: boolean | Function = false;
    try {
        // Тест для IE 6 или старого safari (никто точно не помнит)
        // eslint-disable-next-line
        checkIndexFn = [].indexOf && [undefined].indexOf(undefined) === 0;
    } catch {
        // empty
    }
    const isAccesebleArray = ctx.Array && ctx.Array.prototype;
    const nativeFn =
        isAccesebleArray &&
        toNativeOrFalse(ctx.Array.prototype.indexOf, 'indexOf');
    let indexFn: IndexFn;
    if (checkIndexFn && nativeFn) {
        indexFn = (val, array) => {
            return nativeFn.call(array, val);
        };
    } else {
        indexFn = indexOfPoly;
    }
    indexMemo = indexFn;
    return indexFn as any as IndexFn;
};

export const cIndexOfWin = cIndexOf(window);

/**
 * @type function(...?): ?
 */
export const ctxIndexOf: <T>(arr: T[]) => (el: T) => number =
    curry2SwapArgs(cIndexOfWin);
