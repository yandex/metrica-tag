import { curry2 } from '../function';

export const cSort = <T>(fn: (a: T, b: T) => number, array: T[]) => {
    return Array.prototype.sort.call(array, fn);
};

/**
 * @type function(...?): ?
 */
export const currSort: <T>(fn: (a: T, b: T) => number) => (arr: T[]) => T[] =
    curry2(cSort);
