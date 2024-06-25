import { flags } from '@inject';
import { POLYFILLS_FEATURE } from 'generated/features';
import { toNativeOrFalse } from '../function/isNativeFunction/toNativeOrFalse';
import { curry2 } from '../function';

export const trimRegexp = /^\s+|\s+$/g;

const nativeTrim = toNativeOrFalse(String.prototype.trim, 'trim');
const callNativeOrPoly = (inputString: string) =>
    nativeTrim
        ? nativeTrim.call(inputString)
        : `${inputString}`.replace(trimRegexp, '');
export const trimText = (text: string | null | undefined, length?: number) => {
    if (text) {
        const result = flags[POLYFILLS_FEATURE]
            ? callNativeOrPoly(text)
            : String.prototype.trim.call(text);
        if (length && result.length > length) {
            return result.substring(0, length);
        }
        return result;
    }

    return '';
};

export const removeByRegexp = curry2((regexp: RegExp, str: string) =>
    str.replace(regexp, ''),
);
export const removeSpaces = removeByRegexp(/\s/g);
export const removeNonDigits = removeByRegexp(/\D/g);
export const removeDigits = removeByRegexp(/\d/g);
