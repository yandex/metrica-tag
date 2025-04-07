import { toNativeOrFalse } from 'src/utils/function/isNativeFunction';
import { flags } from '@inject';
import { Some, SomeCallback } from './types';

const nativeSome = toNativeOrFalse(Array.prototype.some, 'some');

export const somePoly: Some = (fn, array) => {
    for (let i = 0; i < array.length; i += 1) {
        // fn не выполняется для отсутствующих или удаленных значений массива (по спецификации)
        if (i in array && fn.call(array, array[i], i)) {
            return true;
        }
    }
    return false;
};

const callNativeOrPoly: Some = nativeSome
    ? <T>(fn: SomeCallback<T>, array: ArrayLike<T>) =>
          nativeSome.call(array, fn)
    : somePoly;

export const cSome: Some = flags.POLYFILLS_FEATURE
    ? callNativeOrPoly
    : <T>(fn: SomeCallback<T>, array: ArrayLike<T>) =>
          Array.prototype.some.call(array, fn);
