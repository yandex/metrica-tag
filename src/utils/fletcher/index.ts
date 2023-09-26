/* eslint-disable no-bitwise */
/**
 * Вычисляет чексумму данных по алгоритму Флетчера.
 */
export function fletcher(data: number[] | string) {
    let { length } = data;
    let i = 0;
    let sum1 = 0xff;
    let sum2 = 0xff;
    let tlen;
    let ch;
    let ch2;
    while (length) {
        tlen = length > 21 ? 21 : length;
        length -= tlen;

        do {
            ch = typeof data === 'string' ? data.charCodeAt(i) : data[i];
            i += 1;
            if (ch > 255) {
                ch2 = ch >> 8;
                ch &= 0xff;
                ch ^= ch2;
            }
            sum1 += ch;
            sum2 += sum1;
            // eslint-disable-next-line no-cond-assign
        } while ((tlen -= 1));
        sum1 = (sum1 & 0xff) + (sum1 >> 8);
        sum2 = (sum2 & 0xff) + (sum2 >> 8);
    }
    const result =
        (((sum1 & 0xff) + (sum1 >> 8)) << 8) | ((sum2 & 0xff) + (sum2 >> 8));
    return result === 0xffff ? 0 : result;
}
