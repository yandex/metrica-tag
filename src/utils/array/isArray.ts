import { protoToString } from 'src/utils/string';
import { flags } from '@inject';
import { POLYFILLS_FEATURE } from 'generated/features';
import { toNativeOrFalse } from '../function/isNativeFunction/toNativeOrFalse';

type isArrayType = <T>(arg: unknown) => arg is T[];

export function isArrayPolyfill<T>(obj: unknown): obj is T[] {
    return protoToString(obj) === '[object Array]';
}

const nativeIsArray = toNativeOrFalse(Array.isArray, 'isArray');

const callNativeOrPoly: isArrayType = nativeIsArray
    ? <T>(obj: unknown): obj is T[] => nativeIsArray(obj)
    : isArrayPolyfill;

export const isArray: isArrayType = flags[POLYFILLS_FEATURE]
    ? callNativeOrPoly
    : <T>(obj: unknown): obj is T[] => Array.isArray(obj);

export const isIterable = <T>(arg: any): arg is Iterable<T> => {
    return typeof arg[Symbol.iterator] === 'function';
};
