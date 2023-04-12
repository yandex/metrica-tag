import { curry2, toNativeOrFalse } from '../function';

export const joinPoly = <A>(str: string, array: A[] | readonly A[]): string => {
    let result = '';
    for (let i = 0; i < array.length; i += 1) {
        result += `${i ? str : ''}${array[i]}`;
    }
    return result;
};

const nativeJoin = toNativeOrFalse(Array.prototype.join, 'join');

export const arrayJoin = nativeJoin
    ? <A>(str: string, array: A[] | readonly A[]): string => {
          return nativeJoin.call(array, str);
      }
    : joinPoly;

export const ctxJoin = curry2(arrayJoin);
