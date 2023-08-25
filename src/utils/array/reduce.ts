import { flags } from '@inject';
import { POLYFILLS_FEATURE } from 'generated/features';
import { F } from 'ts-toolbelt';
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
          (nativeReduce as F.Function<[ReduceCallback<T, U>, U], U>).call(
              array,
              fn,
              first,
          )
    : reducePoly;

export const cReduce: Reduce = flags[POLYFILLS_FEATURE]
    ? callNativeOrPoly
    : <T, U>(fn: ReduceCallback<T, U>, first: U, array?: ArrayLike<T>) =>
          (
              Array.prototype.reduce as F.Function<[ReduceCallback<T, U>, U], U>
          ).call(array, fn, first);

/**
 * @type function(...?): ?
 */
export const ctxReduce = <T, E>(
    fn: (carry: T, element: E, index?: number, array?: E[]) => T,
    first?: T,
) => bindArgs([fn, first], cReduce) as (arr: E[]) => T;
