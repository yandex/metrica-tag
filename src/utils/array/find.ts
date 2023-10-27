import { flags } from '@inject';
import { POLYFILLS_ES6_FEATURE } from 'generated/features';
import { toNativeOrFalse } from 'src/utils/function/isNativeFunction';
import { FindCallback, Find } from './types';

const nativeFind = toNativeOrFalse(Array.prototype.find, 'find');

export const findPoly: Find = (fn, array) => {
    for (let i = 0; i < array.length; i += 1) {
        if (fn.call(array, array[i], i)) {
            return array[i];
        }
    }
    return undefined;
};

const callNativeOrPoly: Find = nativeFind
    ? <T>(fn: FindCallback<T>, array: ArrayLike<T>) =>
          nativeFind.call(array, fn)
    : findPoly;

export const cFind: Find = flags[POLYFILLS_ES6_FEATURE]
    ? callNativeOrPoly
    : <T>(fn: FindCallback<T>, array: ArrayLike<T>) =>
          Array.prototype.find.call(array, fn);
