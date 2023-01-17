import { protoToString } from 'src/utils/string';
import { equal } from '../function/curry';
import { pipe } from '../function/pipe';
import { toNativeOrFalse } from '../function/isNativeFunction/toNativeOrFalse';

type isArrayType = <T>(arg: any) => arg is T[];
/* eslint-disable-next-line import/no-mutable-exports */
export let isArrayFn: isArrayType;
export const isArrayPolyfil: (smth: any) => boolean = pipe(
    protoToString,
    equal('[object Array]'),
);

export const isArray = ((obj: any) => {
    if (isArrayFn) {
        return isArrayFn(obj);
    }
    isArrayFn = toNativeOrFalse(Array.isArray, 'isArray') as any;
    if (!isArrayFn) {
        isArrayFn = isArrayPolyfil as isArrayType;
    }
    return isArrayFn(obj);
}) as isArrayType;
