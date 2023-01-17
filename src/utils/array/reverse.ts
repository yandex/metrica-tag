import { toNativeOrFalse } from 'src/utils/function/isNativeFunction/toNativeOrFalse';

const nativeReverse = toNativeOrFalse(Array.prototype.reverse, 'reverse');
export const reversePoly = <T>(arr: T[]) => {
    const result: T[] = [];
    for (let i = arr.length - 1; i >= 0; i -= 1) {
        result[arr.length - 1 - i] = arr[i];
    }

    return result;
};

export const cReverse: <T>(arr: T[]) => T[] = nativeReverse
    ? (array) => {
          return nativeReverse.call(array);
      }
    : reversePoly;
