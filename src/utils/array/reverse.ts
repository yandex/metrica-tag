import { flags } from '@inject';
import { toNativeOrFalse } from '../function/isNativeFunction/toNativeOrFalse';

const nativeReverse = toNativeOrFalse(Array.prototype.reverse, 'reverse');
export const reversePoly = <T>(arr: T[]) => {
    const result: T[] = [];
    for (let i = arr.length - 1; i >= 0; i -= 1) {
        result[arr.length - 1 - i] = arr[i];
    }

    return result;
};

const callNativeOrPoly = nativeReverse
    ? <T>(array: ArrayLike<T>) => nativeReverse.call(array)
    : reversePoly;

export const cReverse: <T>(arr: T[]) => T[] = flags.POLYFILLS_FEATURE
    ? callNativeOrPoly
    : <T>(array: ArrayLike<T>) => Array.prototype.reverse.call(array);
