import { memo } from 'src/utils/function/memo';
import { notFn } from 'src/utils/function/identity';
import { pipe } from 'src/utils/function/pipe';
import { arrayFrom, arrayFromPoly } from './arrayFrom';
import { cIndexOf } from './indexOf';
import { cFilter } from './filter';
import { ctxIncludes } from './includes';
import { isArray } from './isArray';
import { ctxPath } from '../object/path';

export const getRange = (n: number) => {
    if (n < 0) {
        return [];
    }

    const result = [];
    for (let i = 0; i <= n; i += 1) {
        result.push(i);
    }

    return result;
};

export const toArray = <R = any>(smth: any): R[] => {
    if (!smth) {
        return [];
    }

    if (isArray<R>(smth)) {
        return smth;
    }

    if (arrayFrom) {
        return arrayFrom(smth);
    }

    if (typeof smth.length === 'number' && smth.length >= 0) {
        return arrayFromPoly(smth);
    }

    return [];
};

export const indexOfWin = memo(cIndexOf);

export const exclude = <T>(from: T[] | readonly T[], what: T[]) => {
    return cFilter(pipe(ctxIncludes(what), notFn), from);
};

/**
 * Checks length property of an array-like and returns a boolean.
 *
 * @param {T extends string | unknown[] } array
 * @returns {boolean}
 */
export const isEmptyArray = <T extends string | unknown[] | { length: number }>(
    array: T,
): boolean => array.length === 0;

/**
 * Returns the first element of an array or string.
 */
export const head = ctxPath('0');

/**
 * Returns the last element of an array or string.
 */
export const last = <T>(arrayOrString: string | T[] | ArrayLike<T>) =>
    arrayOrString[arrayOrString.length - 1];

/**
 * Removes all elements from an array returning the deleted elements.
 *
 * @returns — An array containing the elements that were deleted.
 */
export const clearArray = <T>(array: T[]) => array.splice(0, array.length);
