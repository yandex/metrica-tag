import { flags } from '@inject';
import { POLYFILLS_FEATURE } from 'generated/features';
import { Every, EveryCallback } from './types';
import { cReduce } from './reduce';
import { toNativeOrFalse } from '../function';

const nativeEvery = toNativeOrFalse(Array.prototype.every, 'every');

const everyPoly = <T>(fn: EveryCallback<T>, array: ArrayLike<T>) => {
    return cReduce<T, boolean>(
        (flag, value, index) => {
            return flag ? !!fn(value, index) : false;
        },
        true,
        array,
    );
};

const callNativeOrPoly: Every = nativeEvery
    ? <T>(fn: EveryCallback<T>, array: ArrayLike<T>) =>
          nativeEvery.call(array, fn)
    : everyPoly;

export const cEvery: Every = flags[POLYFILLS_FEATURE]
    ? callNativeOrPoly
    : <T>(fn: EveryCallback<T>, array: ArrayLike<T>) =>
          Array.prototype.every.call(array, fn);
