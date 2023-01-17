import { protoToString } from 'src/utils/string';
import { equal } from '../function/curry';

export const isNull = equal(null) as (
    o: any,
    // eslint-disable-next-line no-use-before-define
) => o is null;

export const isFunction = (fn: any): fn is (...args: any[]) => any => {
    return typeof fn === 'function';
};

export const isUndefined = equal(undefined) as (
    o: any,
    // eslint-disable-next-line no-use-before-define
) => o is undefined;

export const isNil = (object: any): object is null | undefined => {
    return isUndefined(object) || isNull(object);
};

/**
 * Полифилл для Object.is(1, 1)
 */
export const is = (v1: any, v2: any) => {
    if (v1 === 0 && v2 === 0) {
        return 1 / v1 === 1 / v2;
    }

    // eslint-disable-next-line no-self-compare
    if (v1 !== v1) {
        // eslint-disable-next-line no-self-compare
        return v2 !== v2;
    }

    return v1 === v2;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export const isObject = <T extends Record<string, any> = object>(
    object: any,
): object is T => {
    return (
        !isNull(object) &&
        !isUndefined(object) &&
        protoToString(object) === '[object Object]'
    );
};
