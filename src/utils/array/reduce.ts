import { flags } from '@inject';
import { Reduce, ReduceCallback } from './types';
import { bindArgs } from '../function/bind/bind';
import { toNativeOrFalse } from '../function/isNativeFunction/toNativeOrFalse';

const nativeReduce = toNativeOrFalse(Array.prototype.reduce, 'reduce');

export const reducePoly: Reduce = <T, U>(
    fn: ReduceCallback<T, U>,
    first: U,
    array: ArrayLike<T>,
) => {
    let i = 0;
    const len = array.length;
    let out = first;
    while (i < len) {
        out = fn(out, array[i], i);
        i += 1;
    }
    return out;
};
const callNativeOrPoly = nativeReduce
    ? <T, U>(fn: ReduceCallback<T, U>, first: U, array?: ArrayLike<T>) =>
          (nativeReduce as (cb: ReduceCallback<T, U>, a: U) => U).call(
              array,
              fn,
              first,
          )
    : reducePoly;

const baseReduce: Reduce = flags.POLYFILLS_FEATURE
    ? callNativeOrPoly
    : <T, U>(fn: ReduceCallback<T, U>, first: U, array?: ArrayLike<T>) =>
          (
              Array.prototype.reduce as (cb: ReduceCallback<T, U>, a: U) => U
          ).call(array, fn, first);

/** Pure reduce */
export const cReduce = baseReduce;

/**
 * Impure reduce, side-efects possible.
 * It's not marked PURE at build time
 * and thus not cut off, if result is unused.
 */
export const dirtyReduce = baseReduce;

/**
 * @type function(...?): ?
 */
export const ctxReduce = <Result, Item>(
    fn: ReduceCallback<Item, Result>,
    first: Result,
) =>
    bindArgs([fn, first], cReduce<Item, Result>) as (
        array: ArrayLike<Item>,
    ) => Result;
