import { curry2SwapArgs, equal } from '../function';
import { filterPoly } from './filter';

export const includesPoly = <E>(e: E, array: E[] | readonly E[]): boolean => {
    return filterPoly(equal(e), array).length >= 1;
};

export const includes = Array.prototype.includes
    ? <E>(el: E, array: E[] | readonly E[]): boolean => {
          return Array.prototype.includes.call(array, el);
      }
    : includesPoly;

/**
 * первый аргумент где второй что
 * @type function(...?): ?
 */
export const ctxIncludes: <T>(arr: T[] | readonly T[]) => (el: T) => boolean =
    curry2SwapArgs(includes);
