import { flags } from '@inject';
import { toNativeOrFalse } from '../function/isNativeFunction/toNativeOrFalse';
import { StringIndexOf } from './types';

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
