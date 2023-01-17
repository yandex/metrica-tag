import { cEvery } from '../array/every';
import { bindArg } from '../function/bind';
import { isObject } from './assertions';
import { isPrimitive, Primitive } from './isPrimitive';
import { cValues } from './utils';

/**
 * Check if an input is an object and if max depth condition is met.
 * Used to verify an object does not contain circular loops.
 */
export const isPlainObject = (
    ctx: Window,
    object: unknown,
): object is Record<string, Primitive> => {
    return (
        isObject(object) && cEvery(bindArg(ctx, isPrimitive), cValues(object))
    );
};
