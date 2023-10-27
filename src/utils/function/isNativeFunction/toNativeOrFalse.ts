import { isNativeFunction } from 'src/utils/function/isNativeFunction/isNativeFunction';
import { AnyFunc } from '../types';

export const toNativeOrFalse = <F extends AnyFunc>(
    fn: F,
    functionName: string,
) => isNativeFunction(functionName, fn) && fn;
