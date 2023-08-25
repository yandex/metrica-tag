import { flags } from '@inject';
import { POLYFILLS_FEATURE } from 'generated/features';
import { curry2SwapArgs, equal, toNativeOrFalse } from '../function';
import { filterPoly } from './filter';
import { Includes } from './types';

const nativeIncludes = toNativeOrFalse(Array.prototype.includes, 'includes');

// TODO add `fromIndex` support
export const includesPoly: Includes = (e, array) => {
    return filterPoly(equal(e), array).length >= 1;
};

const callNativeOrPoly = nativeIncludes
    ? <T>(searchElement: T, array: ArrayLike<T>, fromIndex?: number) =>
          nativeIncludes.call(array, searchElement, fromIndex)
    : includesPoly;

export const includes: Includes = flags[POLYFILLS_FEATURE]
    ? callNativeOrPoly
    : <T>(searchElement: T, array: ArrayLike<T>, fromIndex?: number) =>
          Array.prototype.includes.call(array, searchElement, fromIndex);

/**
 * первый аргумент где второй что
 * @type function(...?): ?
 */
export const ctxIncludes: <T>(arr: ArrayLike<T>) => (el: T) => boolean =
    curry2SwapArgs(includes);
