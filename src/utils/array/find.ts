import { isNativeFunction } from 'src/utils/function/isNativeFunction';

const isNativeFind = isNativeFunction('find', Array.prototype.find);

export const findPoly = <T>(
    fn: (value: T, index?: number, obj?: T[]) => boolean,
    array: T[] | readonly T[],
): T | undefined => {
    for (let i = 0; i < array.length; i += 1) {
        if (fn.call(array, array[i], i)) {
            return array[i];
        }
    }
    return undefined;
};

export const cFind = isNativeFind
    ? <T>(
          fn: (value: T, index?: number, obj?: T[]) => boolean,
          array: T[] | readonly T[],
      ): T | undefined => Array.prototype.find.call(array, fn)
    : findPoly;
