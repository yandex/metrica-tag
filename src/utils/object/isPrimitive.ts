import { isString } from '../string';
import { isNumber } from '../number/number';
import { isNull, isUndefined } from './assertions';

export type Primitive = null | undefined | number | string | boolean;

export const isPrimitive = (ctx: Window, object: any): object is Primitive => {
    return (
        isNull(object) ||
        isUndefined(object) ||
        isNumber(ctx, object) ||
        isString(object) ||
        !!object === object // is boolean
    );
};
