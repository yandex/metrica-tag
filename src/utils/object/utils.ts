import { flags } from '@inject';
import { POLYFILLS_FEATURE } from 'generated/features';
import { F } from 'ts-toolbelt';
import { mapPoly, reducePoly } from '../array';
import { bindArg, pipe, toNativeOrFalse } from '../function';
import { isUndefined } from './assertions';
import { has } from './has';
import { ctxPath } from './path';
import { Entries, Keys } from './types';

export const { toString: cachedToString } = Object.prototype;

export const toString = (object: any): ReturnType<typeof cachedToString> => {
    return cachedToString.call(object);
};

export const splice = (object: any, field: string) => {
    const val = object[field];
    delete object[field];

    return val;
};

const nativeKeys = toNativeOrFalse(Object.keys, 'keys');

export const keysPoly = (obj: Record<string, any>) => {
    const out = [];
    let key: string;
    // eslint-disable-next-line no-restricted-syntax
    for (key in obj) {
        if (has(obj, key)) {
            out.push(key);
        }
    }

    return out;
};

const nativeEntries = toNativeOrFalse(Object.entries, 'entries');

export const entriesPoly: Entries = <T>(obj?: Record<string, T>) => {
    if (isUndefined(obj)) {
        return [];
    }
    return reducePoly(
        (rawResult: [string, T][], key: string) => {
            const result = rawResult;
            result.push([key, obj[key]]);
            return result;
        },
        [],
        keysPoly(obj),
    );
};
const callEntries =
    <T>(entriesFunc: F.Function<[Record<string, T>], [string, T][]>) =>
    (obj?: Record<string, T>) => {
        if (!obj) {
            return [];
        }
        return entriesFunc(obj);
    };

const callNativeOrPolyEntries = nativeEntries
    ? callEntries(nativeEntries)
    : entriesPoly;

export const entries: Entries = flags[POLYFILLS_FEATURE]
    ? callNativeOrPolyEntries
    : callEntries(Object.entries);

const callNativeOrPolyKeys = nativeKeys
    ? (obj: Record<string, unknown>) => nativeKeys(obj)
    : keysPoly;

export const cKeys: Keys = flags[POLYFILLS_FEATURE]
    ? callNativeOrPolyKeys
    : (obj: Record<string, unknown>) => Object.keys(obj);

const nativeValues = toNativeOrFalse(Object.values, 'values');

export const valuesPoly: typeof Object.values = pipe(
    entriesPoly,
    bindArg(ctxPath('1'), mapPoly),
);

const callNativeOrPolyValues = nativeValues
    ? <T>(obj: Record<string, T>) => nativeValues(obj)
    : valuesPoly;

export const cValues: typeof Object.values = flags[POLYFILLS_FEATURE]
    ? callNativeOrPolyValues
    : <T>(obj: Record<string, T>) => Object.values(obj);
