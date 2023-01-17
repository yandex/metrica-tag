import { toNativeOrFalse } from '../function/isNativeFunction/toNativeOrFalse';

export const DOT_REGEX_GLOBAL = /\./g;

export const protoToString = (str: string) => {
    return Object.prototype.toString.call(str);
};

export const isString = (obj: unknown): obj is string => {
    return typeof obj === 'string';
};

const nativeIndexOf = toNativeOrFalse(String.prototype.indexOf, 'indexOf');

export const stringIndexOfPoly = (str: string, substring: string) => {
    let j = 0;
    const lastPoint = str.length - substring.length;
    for (let i = 0; i < str.length; i += 1) {
        if (str[i] === substring[j]) {
            j += 1;
        } else {
            j = 0;
        }

        if (j === substring.length) {
            return i - substring.length + 1;
        }

        if (!j && i > lastPoint) {
            return -1;
        }
    }

    return -1;
};

export const stringIndexOf = (string: string, substring: string) => {
    return nativeIndexOf
        ? nativeIndexOf.call(string, substring)
        : stringIndexOfPoly(string, substring);
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
