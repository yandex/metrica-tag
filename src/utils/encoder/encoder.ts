/* eslint no-bitwise: 0 */
// в этом файле битовые операции нужны

import { arrayJoin } from '../array/join';

const Base64 = {
    abc: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    tail: '+/=',
    tailSafe: '*-_',
};

export const encode = (data: number[], safe = false) => {
    const abc = (Base64.abc + (safe ? Base64.tailSafe : Base64.tail)).split('');
    const { length } = data;
    const result = [];
    const lPos = length - (length % 3);
    let t;

    for (let i = 0; i < lPos; i += 3) {
        t = (data[i] << 16) + (data[i + 1] << 8) + data[i + 2];
        result.push(
            abc[(t >> 18) & 0x3f],
            abc[(t >> 12) & 0x3f],
            abc[(t >> 6) & 0x3f],
            abc[t & 0x3f],
        );
    }
    switch (length - lPos) {
        case 1:
            t = data[lPos] << 4;
            result.push(abc[(t >> 6) & 0x3f], abc[t & 0x3f], abc[64], abc[64]);
            break;
        case 2:
            t = (data[lPos] << 10) + (data[lPos + 1] << 2);
            result.push(
                abc[(t >> 12) & 0x3f],
                abc[(t >> 6) & 0x3f],
                abc[t & 0x3f],
                abc[64],
            );
            break;
        default:
    }
    return arrayJoin('', result);
};
