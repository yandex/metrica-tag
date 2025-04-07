import { flags } from '@inject';
import { Filter, FilterCallback, nullable } from './types';
import { curry2 } from '../function/curry';
import { reducePoly } from './reduce';
import { bindArg } from '../function/bind';
import { toNativeOrFalse } from '../function/isNativeFunction';
import { toBoolean } from '../boolean';

const nativeFilter = toNativeOrFalse(Array.prototype.filter, 'filter');

export const filterPoly = <T>(fn: FilterCallback<T>, array: ArrayLike<T>) => {
    return reducePoly<T, T[]>(
        (result, item, i) => {
            if (fn(item, i)) {
                result.push(item);
            }
            return result;
        },
        [],
        array,
    );
};
const callNativeOrPoly: Filter = nativeFilter
    ? <T>(predicate: FilterCallback<T>, array: ArrayLike<T>) =>
          nativeFilter.call(array, predicate)
    : filterPoly;

export const cFilter: Filter = flags.POLYFILLS_FEATURE
    ? callNativeOrPoly
    : <T>(predicate: FilterCallback<T>, array: ArrayLike<T>) =>
          Array.prototype.filter.call(array, predicate);

type FilterFalsy = <T>(array: ArrayLike<T>) => Exclude<T, nullable>[];
export const filterFalsy = bindArg(toBoolean, cFilter) as FilterFalsy;

export const ctxFilter = curry2(cFilter);
