import { Filter } from './types';
import { toNativeOrFalse } from '../function/isNativeFunction/toNativeOrFalse';
import { curry2 } from '../function/curry';
import { reducePoly } from './reduce';
import { bindArg } from '../function';

const nativeFilter = toNativeOrFalse(Array.prototype.filter, 'filter');

export const filterPoly: Filter = <T, R = T>(
    fn: (e: T, i?: number) => boolean,
    array: T[] | readonly T[],
): R[] => {
    return reducePoly(
        (result: R[], item: T, i: number) => {
            if (fn(item, i)) {
                result.push(item as unknown as R);
            }
            return result;
        },
        [],
        array,
    );
};

export const cFilter: Filter = nativeFilter
    ? (fn, array) => {
          return nativeFilter.call(array, fn);
      }
    : filterPoly;

type FilterFalsy = <T>(
    array: T[] | readonly T[],
) => Exclude<T, null | undefined | '' | 0 | false>[];
export const filterFalsy = bindArg(Boolean, cFilter) as FilterFalsy;

export const ctxFilter = curry2(cFilter);
