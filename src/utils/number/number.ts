import { protoToString } from 'src/utils/string';
import { curry2SwapArgs } from '../function/curry';

export const MAX_INT_32 = 2147483647;

export const isNumber = (ctx: Window, obj: any): obj is number => {
    return (
        ctx.isFinite(obj) &&
        !ctx.isNaN(obj) &&
        protoToString(obj) === '[object Number]'
    );
};

/**
 * In case of monkey patching toString and indexOf methods
 * or passing an object without prototype,
 * isNumber throws a type error
 */
export const isNumberSafe = (ctx: Window, obj: any): obj is number => {
    try {
        return isNumber(ctx, obj);
    } catch {
        return false;
    }
};

export const toNumber = (obj: any): number => +obj;

export const parseIntSafe = (val: string) => {
    try {
        return parseInt(val, 10);
    } catch (e) {
        return null;
    }
};

const parseIntSwap = curry2SwapArgs(parseInt);
export const parseDecimalInt = parseIntSwap(10);
export const parseBinaryInt = parseIntSwap(2);
