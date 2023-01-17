import { argsToArray } from '../function/args';
import { curry2 } from '../function/curry';
import { has } from './has';

export const assignPoly: (...args: any[]) => any = function assignPoly() {
    // eslint-disable-next-line prefer-rest-params
    const assignArgs = argsToArray(arguments);
    const [dst, ...args] = assignArgs;
    while (args.length) {
        const obj = args.shift();
        // eslint-disable-next-line no-restricted-syntax
        for (const key in obj) {
            if (has(obj, key)) {
                dst[key] = obj[key];
            }
        }
        /**
         * по всей видимости в каких-то браузерах проп toString не попадал в for..in
         * но попадал в obj.hasOwnProperty
         * поэтому приходится вручную проверять
         */
        if (has(obj, 'toString')) {
            dst['toString'] = obj['toString'];
        }
    }
    return dst;
};

export const mix = Object.assign || assignPoly;

/**
 * @type function(...*): *
 * с curry2 не выйдет потому что нужен каждый раз новый экземпляр объекта
 */
export const ctxMix = curry2(<T, R>(obj1: T, obj2: R) => {
    return mix({}, obj1, obj2) as T & R;
});
