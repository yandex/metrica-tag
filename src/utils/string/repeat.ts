import { toNativeOrFalse } from 'src/utils/function/isNativeFunction/toNativeOrFalse';
import { bindArg } from '../function';

const nativeRepeat = toNativeOrFalse(String.prototype.repeat, 'repeat');

export const repeatPoly = (text: string, times: number) => {
    let result = '';
    for (let i = 0; i < times; i += 1) {
        result += text;
    }

    return result;
};

export const repeat = nativeRepeat
    ? (text: string, times: number) => nativeRepeat.call(text, times)
    : repeatPoly;

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

type PadFunction = (
    padString: string,
    targetLength: number,
    part: string,
) => string;

export const padStart: PadFunction = bindArg(true, pad);
export const padEnd: PadFunction = bindArg(false, pad);
