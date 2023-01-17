import { isNativeFunction } from 'src/utils/function/isNativeFunction/isNativeFunction';
import { F } from 'ts-toolbelt';

export const toNativeOrFalse = <
    P extends ReadonlyArray<any> = any,
    R extends unknown = any,
>(
    fn: F.Function<P, R>,
    functionName: string,
) => isNativeFunction(functionName, fn) && fn;
