import { toNativeOrFalse } from '../function/isNativeFunction';
import { isUndefined } from '../object';

export const RND_MAX = 1073741824;
export const RND_MIN = 1;

/**
 * Generate a random number in a given frame
 */
export const getRandom = (ctx: Window, rawMin?: number, rawMax?: number) => {
    let min: number;
    let max: number;
    const isMaxUndef = isUndefined(rawMax);

    if (isUndefined(rawMin) && isMaxUndef) {
        min = 1;
        max = RND_MAX;
    } else if (isMaxUndef) {
        min = 1;
        max = rawMin as number;
    } else {
        min = rawMin as number;
        max = rawMax!;
    }
    return ctx.Math.floor(ctx.Math.random() * (max - min)) + min;
};

export const getSafeRandom = (ctx: Window) => {
    const nativeGetRandomValues =
        ctx.crypto &&
        toNativeOrFalse(ctx.crypto.getRandomValues, 'getRandomValues');

    if (nativeGetRandomValues) {
        const array = new Uint32Array(1);
        nativeGetRandomValues.call(ctx.crypto, array);
        return array[0] / 0x100000000; // 2^32
    }

    return ctx.Math.random();
};
