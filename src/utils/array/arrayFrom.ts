import { toNativeOrFalse } from 'src/utils/function/isNativeFunction/toNativeOrFalse';

const nativeArrayFrom = toNativeOrFalse(Array.from, 'from') as
    | typeof Array.from
    | false;

/**
 * TODO: Maybe add the mapping here (similar to native method). Note: we do have the use cases.
 */
export const arrayFromPoly = <T>(arrayLike: ArrayLike<T>): T[] => {
    const len = arrayLike.length;
    const result: T[] = [];
    for (let i = 0; i < len; i += 1) {
        result.push(arrayLike[i]);
    }

    return result;
};

/**
 * Create an array from an ArrayLike or an Iterable.
 * NOTE: It throws on null and undefined inputs. Thus do not cast the argument to any.
 */
export const arrayFrom = nativeArrayFrom || arrayFromPoly;
