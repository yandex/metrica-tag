import { toNativeOrFalse } from 'src/utils/function/isNativeFunction/toNativeOrFalse';
import { isFF } from 'src/utils/browser/firefox';
import { ArrayMap, FlatMap } from './types';
import { curry2, curry2SwapArgs } from '../function/curry';
import { reducePoly } from './reduce';
import { isArray } from './isArray';

const isLengthCorrect = (ctx: Window, method: Function) => {
    if (!isFF(ctx)) {
        return true;
    }

    /*
        <= v42 - "Expected int32 as second argument" METR-37094, METR-41438
        v43-v49 - Зависает при передаче { length: -1 } METRIKASUPP-12625
     */
    try {
        method.call({ 0: true, length: -(2 ** 32) + 1 }, () => {
            // eslint-disable-next-line no-throw-literal
            throw 1;
        });
    } catch {
        return false;
    }
    return true;
};

const nativeMap = toNativeOrFalse(Array.prototype.map, 'map');

export const mapPoly: ArrayMap = (fn: Function, array: readonly any[]) => {
    return reducePoly(
        (rawResult, item, i) => {
            const result = rawResult;
            result.push(fn(item, i));
            return result;
        },
        [],
        array as any[],
    );
};

export const baseMap: ArrayMap =
    nativeMap && isLengthCorrect(window, Array.prototype.map)
        ? (fn: (e: any, i: number) => any, array: readonly any[]) => {
              // FIXME METR-40760
              return array && array.length > 0 ? nativeMap.call(array, fn) : [];
          }
        : mapPoly;
export const cMap = baseMap;

export const cForEach = baseMap; // cForEach - тоже самое что cMap, но она может иметь сайд эффекты, cMap - чистая ф-ция

export const flatMapPoly: FlatMap = (fn: Function, array: any[]) => {
    return reducePoly(
        (result, item, i: number) => {
            const fnResult = fn(item, i);
            return result.concat(isArray(fnResult) ? fnResult : [fnResult]);
        },
        [],
        array,
    );
};

export const flatMap: FlatMap = Array.prototype.flatMap
    ? (fn: (e: any, i: number) => any, array: any[]) => {
          return Array.prototype.flatMap.call(array, fn) as any[];
      }
    : flatMapPoly;

/**
 * @type function(...?): ?
 */
export const ctxMap: <T, R>(cb: (e: T, i: number) => R) => (arr: T[]) => R[] =
    curry2(cMap) as any;

export const ctxForEach: <T, R>(
    cb: (e: T, i: number) => R,
) => (arr: T[]) => void = curry2(cForEach) as any;

export const ctxMapSwap = curry2SwapArgs(cMap) as <T, R>(
    // eslint-disable-next-line no-use-before-define
    arr: T[],
) => (cb: (e: T, i: number) => R) => R[];
