import { toNativeOrFalse } from 'src/utils/function/isNativeFunction/toNativeOrFalse';
import { Reduce } from './types';
import { bindArgs } from '../function/bind';

const nativeReduce = toNativeOrFalse(Array.prototype.reduce, 'reduce');

export const reducePoly: Reduce = (fn: any, first: any, array: any) => {
    let i = 0;
    const len = array.length;
    let out = first;
    while (i < len) {
        out = fn(out, array[i], i);
        i += 1;
    }
    return out;
};

export const cReduce: Reduce = nativeReduce
    ? (fn: any, first?: any, array?: any) => {
          return nativeReduce.call(array, fn, first);
      }
    : reducePoly;

/**
 * @type function(...?): ?
 */
export const ctxReduce = <T, E>(
    fn: (carry: T, element: E, index?: number, array?: E[]) => T,
    first?: T,
) => bindArgs([fn, first], cReduce) as (arr: E[]) => T;
