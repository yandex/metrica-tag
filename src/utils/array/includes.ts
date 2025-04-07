import { flags } from '@inject';
import { curry2SwapArgs, equal } from '../function/curry';
import { filterPoly } from './filter';
import { Includes } from './types';
import { toNativeOrFalse } from '../function/isNativeFunction/toNativeOrFalse';

const nativeIncludes = toNativeOrFalse(Array.prototype.includes, 'includes');

// TODO add `fromIndex` support
export const includesPoly: Includes = (e, array) => {
    return filterPoly(equal(e), array).length >= 1;
};

const callNativeOrPoly = nativeIncludes
    ? <T>(searchElement: T, array: ArrayLike<T>, fromIndex?: number) =>
          nativeIncludes.call(array, searchElement, fromIndex)
    : includesPoly;

export const includes: Includes = flags.POLYFILLS_ES6_FEATURE
    ? callNativeOrPoly
    : <T>(searchElement: T, array: ArrayLike<T>, fromIndex?: number) =>
          Array.prototype.includes.call(array, searchElement, fromIndex);

export const ctxIncludes = curry2SwapArgs(includes);
