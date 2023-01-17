import { curry2 } from '../function';
import { toNativeOrFalse } from '../function/isNativeFunction/toNativeOrFalse';

export const trimRegexp = /^\s+|\s+$/g;

const nativeTrim = toNativeOrFalse(String.prototype.trim, 'trim');
export const trimText = (text: string | null | undefined, length?: number) => {
    if (text) {
        const result = nativeTrim
            ? nativeTrim.call(text)
            : `${text}`.replace(trimRegexp, '');
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
