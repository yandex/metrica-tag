const base64abc =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const safeBase64replacement: Record<string, string> = {
    // safe decode
    '*': '+',
    '-': '/',
    _: '=',
    // safe encode
    '+': '*',
    '/': '-',
    '=': '_',
};

/* eslint-disable no-bitwise */
/* eslint-disable no-plusplus */
export const replaceBase64 = (str: string, safe = false): string => {
    if (!str) {
        return '';
    }

    // Заменить обычные на безопасные символы или наоборот (зависит от флага)
    // encoder - в полученной base64 заменяет символы на безопасные
    // decoder - перед декодингом заменяет все безопасные на обычные
    return str.replace(safe ? /[+/=]/g : /[-*_]/g, (c) => {
        return safeBase64replacement[c] || c;
    });
};

export const decodeBase64 = (baseStr: string, safe = false): string => {
    let str = baseStr;
    let result = '';
    let i = 0;

    if (!str) {
        return '';
    }

    if (safe) {
        str = replaceBase64(str);
    }

    while (str.length % 4) {
        str += '=';
    }

    do {
        // unpack four hexets into three octets using index points in b64b
        const h1 = base64abc.indexOf(str.charAt(i++));
        const h2 = base64abc.indexOf(str.charAt(i++));
        const h3 = base64abc.indexOf(str.charAt(i++));
        const h4 = base64abc.indexOf(str.charAt(i++));

        if (h1 < 0 || h2 < 0 || h3 < 0 || h4 < 0) {
            return '';
        }

        const bits = (h1 << 18) | (h2 << 12) | (h3 << 6) | h4;

        const o1 = (bits >> 16) & 0xff;
        const o2 = (bits >> 8) & 0xff;
        const o3 = bits & 0xff;

        if (h3 === 64) {
            result += String.fromCharCode(o1);
        } else if (h4 === 64) {
            result += String.fromCharCode(o1, o2);
        } else {
            result += String.fromCharCode(o1, o2, o3);
        }
    } while (i < str.length);

    return result;
};

export const encodeBase64 = (data: number[], safe = false) => {
    const { length: len } = data;
    const lPos = len - (len % 3);
    const result = [];

    for (let i = 0; i < lPos; i += 3) {
        const t = (data[i] << 16) + (data[i + 1] << 8) + data[i + 2];
        result.push(
            base64abc[(t >> 18) & 0x3f],
            base64abc[(t >> 12) & 0x3f],
            base64abc[(t >> 6) & 0x3f],
            base64abc[t & 0x3f],
        );
    }
    let t;
    switch (len - lPos) {
        case 1:
            t = data[lPos] << 4;
            result.push(
                base64abc[(t >> 6) & 0x3f],
                base64abc[t & 0x3f],
                base64abc[64],
                base64abc[64],
            );
            break;
        case 2:
            t = (data[lPos] << 10) + (data[lPos + 1] << 2);
            result.push(
                base64abc[(t >> 12) & 0x3f],
                base64abc[(t >> 6) & 0x3f],
                base64abc[t & 0x3f],
                base64abc[64],
            );
            break;
        default:
    }

    const str = result.join('');

    return safe ? replaceBase64(str, true) : str;
};

export const decodeUtf8 = (str: string): string => {
    let result = '';
    let i = 0;

    while (i < str.length) {
        const char = str.charCodeAt(i);
        if (char < 128) {
            result += String.fromCharCode(char);
            i++;
        } else if (char > 191 && char < 224) {
            const c2 = str.charCodeAt(i + 1);
            result += String.fromCharCode(((char & 31) << 6) | (c2 & 63));
            i += 2;
        } else {
            const c2 = str.charCodeAt(i + 1);
            const c3 = str.charCodeAt(i + 2);
            result += String.fromCharCode(
                ((char & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63),
            );
            i += 3;
        }
    }

    return result;
};

export const encodeUtf8 = (str: string): number[] => {
    const result = [];

    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);

        if (c < 128) {
            result.push(c);
        } else if (c > 127 && c < 2048) {
            result.push((c >> 6) | 192);
            result.push((c & 63) | 128);
        } else {
            result.push((c >> 12) | 224);
            result.push(((c >> 6) & 63) | 128);
            result.push((c & 63) | 128);
        }
    }

    return result;
};
/* eslint-enable no-plusplus */
/* eslint-enable no-bitwise */
