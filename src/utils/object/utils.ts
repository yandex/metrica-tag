import { mapPoly, reducePoly } from '../array';
import { bindArg, pipe } from '../function';
import { isUndefined } from './assertions';
import { has } from './has';
import { ctxPath } from './path';

export const { toString: cachedToString } = Object.prototype;

export const toString = (object: any): ReturnType<typeof cachedToString> => {
    return cachedToString.call(object);
};

export const splice = (object: any, field: string) => {
    const val = object[field];
    delete object[field];

    return val;
};

interface Entries {
    <T>(o?: { [s: string]: T } | ArrayLike<T>): [string, T][];
    (o?: {}): [string, any][];
}

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

export const entriesPoly = (obj?: Record<string, any>) => {
    if (isUndefined(obj)) {
        return [];
    }
    return reducePoly(
        (rawResult: [string, any][], key: string) => {
            const result = rawResult;
            result.push([key, obj[key]]);
            return result;
        },
        [],
        keysPoly(obj),
    );
};

export const entries: Entries = Object.entries
    ? (obj?: Record<string, any>) => {
          if (!obj) {
              return [];
          }
          return Object.entries(obj);
      }
    : entriesPoly;

export const cKeys: typeof Object.keys = Object.keys ? Object.keys : keysPoly;

export const valuesPoly: typeof Object.values = pipe(
    entriesPoly,
    bindArg(ctxPath('1'), mapPoly),
);

export const cValues: typeof Object.values = Object.values
    ? Object.values
    : valuesPoly;
