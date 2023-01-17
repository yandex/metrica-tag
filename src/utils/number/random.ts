import { isUndefined } from '../object';

export const RND_MAX = 1073741824;
export const RND_MIN = 1;

/**
 * Генерим рандомное число
 * @param {Object} ctx
 * @param {number} [rawMin]
 * @param {number} [rawMax]
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
