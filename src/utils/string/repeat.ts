import { flags } from '@inject';
import { bindArg } from 'src/utils/function/bind';
import { toNativeOrFalse } from 'src/utils/function/isNativeFunction';
import { Repeat } from './types';

const nativeRepeat = toNativeOrFalse(String.prototype.repeat, 'repeat');

export const repeatPoly: Repeat = (inputString, count) => {
    let result = '';
    for (let i = 0; i < count; i += 1) {
        result += inputString;
    }

    return result;
};

const callNativeOrPoly = nativeRepeat
    ? (inputString: string, count: number) =>
          nativeRepeat.call(inputString, count)
    : repeatPoly;

export const repeat: Repeat = flags.POLYFILLS_FEATURE
    ? callNativeOrPoly
    : (inputString: string, count: number) =>
          String.prototype.repeat.call(inputString, count);

const pad = (
    start: boolean,
    padString: string,
    targetLength: number,
    part: string,
) => {
    const repeatLength =
        padString.length && (targetLength - part.length) / padString.length;

    if (repeatLength <= 0) {
        return part;
    }

    const padding = repeat(padString, repeatLength);
    return start ? padding + part : part + padding;
};

export const padStart = bindArg(true, pad);
export const padEnd = bindArg(false, pad);
