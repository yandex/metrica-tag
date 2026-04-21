import { flags } from '@inject';
import { toNativeOrFalse } from '../function/isNativeFunction/toNativeOrFalse';
import { StringIndexOf, StringLastIndexOf } from './types';

export const DOT_REGEX_GLOBAL = /\./g;

export const protoToString = <T>(str: T) => {
    return Object.prototype.toString.call(str);
};

export const isString = (obj: unknown): obj is string => {
    return typeof obj === 'string';
};

const nativeStringIndexOf = toNativeOrFalse(
    String.prototype.indexOf,
    'indexOf',
);

export const stringIndexOfPoly: StringIndexOf = (inputString, searchString) => {
    let j = 0;
    const lastPoint = inputString.length - searchString.length;
    for (let i = 0; i < inputString.length; i += 1) {
        if (inputString[i] === searchString[j]) {
            j += 1;
        } else {
            j = 0;
        }

        if (j === searchString.length) {
            return i - searchString.length + 1;
        }

        if (!j && i > lastPoint) {
            return -1;
        }
    }

    return -1;
};

const callNativeOrPoly = nativeStringIndexOf
    ? (inputString: string, searchString: string) =>
          nativeStringIndexOf.call(inputString, searchString)
    : stringIndexOfPoly;

export const stringIndexOf: StringIndexOf = (inputString, searchString) => {
    return flags.POLYFILLS_FEATURE
        ? callNativeOrPoly(inputString, searchString)
        : String.prototype.indexOf.call(inputString, searchString);
};

const nativeStringLastIndexOf = toNativeOrFalse(
    String.prototype.lastIndexOf,
    'lastIndexOf',
);

export const stringLastIndexOfPoly: StringLastIndexOf = (
    inputString,
    searchString,
) => {
    const searchLen = searchString.length;
    const strLen = inputString.length;

    if (searchLen === 0) {
        return strLen;
    }

    for (let i = strLen - searchLen; i >= 0; i -= 1) {
        let match = true;
        for (let j = 0; j < searchLen; j += 1) {
            if (inputString[i + j] !== searchString[j]) {
                match = false;
                break;
            }
        }
        if (match) {
            return i;
        }
    }

    return -1;
};

const callNativeOrPolyLastIndexOf = nativeStringLastIndexOf
    ? (inputString: string, searchString: string) =>
          nativeStringLastIndexOf.call(inputString, searchString)
    : stringLastIndexOfPoly;

export const stringLastIndexOf: StringLastIndexOf = (
    inputString,
    searchString,
) => {
    return flags.POLYFILLS_FEATURE
        ? callNativeOrPolyLastIndexOf(inputString, searchString)
        : String.prototype.lastIndexOf.call(inputString, searchString);
};

export const stringIncludes = (string: string, substring: string) => {
    return !!(string && stringIndexOf(string, substring) !== -1);
};

export const convertToString = <T>(value: T): string => {
    return `${value}`;
};

export const escapeForRegExp = (str: string) => {
    return str
        .replace(/\^/g, '\\^')
        .replace(/\$/g, '\\$')
        .replace(DOT_REGEX_GLOBAL, '\\.')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]')
        .replace(/\|/g, '\\|')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/\?/g, '\\?')
        .replace(/\*/g, '\\*')
        .replace(/\+/g, '\\+')
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}');
};
