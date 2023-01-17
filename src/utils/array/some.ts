import { isNativeFunction } from 'src/utils/function/isNativeFunction';
import { ternary } from 'src/utils/condition';

export const somePoly = <T>(fn: any, array: T[]): boolean => {
    for (let i = 0; i < array.length; i += 1) {
        // fn не выполняется для отсутствующих или удаленных значений массива (по спецификации)
        if (i in array && fn.call(array, array[i], i)) {
            return true;
        }
    }
    return false;
};

export const cSome = ternary(
    <E>(fn: any, array: E[]): boolean => {
        return Array.prototype.some.call(array, fn);
    },
    somePoly,
    isNativeFunction('some', Array.prototype.some),
);
