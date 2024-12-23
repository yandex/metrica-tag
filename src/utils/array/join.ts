import { flags } from '@inject';
import { POLYFILLS_FEATURE } from 'generated/features';
import { curry2 } from '../function/curry';
import { Join } from './types';
import { toNativeOrFalse } from '../function/isNativeFunction/toNativeOrFalse';

export const joinPoly: Join = (separator, array) => {
    let result = '';
    for (let i = 0; i < array.length; i += 1) {
        result += `${i ? separator : ''}${array[i]}`;
    }
    return result;
};

const nativeJoin = toNativeOrFalse(Array.prototype.join, 'join');

const callNativeOrPoly = nativeJoin
    ? <T>(separator: string, array: ArrayLike<T>) =>
          nativeJoin.call(array, separator)
    : joinPoly;

export const arrayJoin: Join = flags[POLYFILLS_FEATURE]
    ? callNativeOrPoly
    : <T>(separator: string, array: ArrayLike<T>) =>
          Array.prototype.join.call(array, separator);

export const ctxJoin = curry2(arrayJoin);
