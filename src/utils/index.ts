/* eslint-disable no-bitwise */
// https://github.com/RubenVerborgh/promiscuous !?!?
import * as polyPromise from 'promise-polyfill';
import { POLYFILLS_FEATURE } from 'generated/features';
import { flags } from '@inject';
import { toNativeOrFalse } from 'src/utils/function/isNativeFunction/toNativeOrFalse';
import { includes } from 'src/utils/array/includes';
import { bind } from './function/bind';
import { getPath } from './object';

/* eslint-disable-next-line import/no-mutable-exports */
let PolyPromise: PromiseConstructor = window.Promise;

if (flags[POLYFILLS_FEATURE]) {
    const construct = toNativeOrFalse(PolyPromise as any, 'Promise');
    const resolve = toNativeOrFalse(
        getPath(PolyPromise, 'resolve')!,
        'resolve',
    );
    const reject = toNativeOrFalse(getPath(PolyPromise, 'reject')!, 'reject');
    const all = toNativeOrFalse(getPath(PolyPromise, 'all')!, 'all');
    if (includes(false, [construct, resolve, reject, all])) {
        PolyPromise = polyPromise.default;
    } else {
        const anyPromise = function promiseWrapper(a: any) {
            return new Promise(a);
        } as any;
        anyPromise.resolve = bind(resolve as any, PolyPromise);
        anyPromise.reject = bind(reject as any, PolyPromise);
        anyPromise.all = bind(all as any, PolyPromise);
        PolyPromise = anyPromise;
    }
}

export { PolyPromise };

/**
 * Вычисляет чексумму данных по алгоритму Флетчера.
 *
 * @param {Array|String} data
 *
 * @returns {Number}
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
