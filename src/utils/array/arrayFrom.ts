import { toNativeOrFalse } from 'src/utils/function/isNativeFunction/toNativeOrFalse';

export const arrayFrom = toNativeOrFalse(
    Array.from,
    'from',
) as typeof Array.from;
export const arrayFromPoly = (smth: any) => {
    const len = smth.length;
    const result = [];
    for (let i = 0; i < len; i += 1) {
        result.push(smth[i]);
    }

    return result;
};
