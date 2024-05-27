import { reportNonNativeFunction } from 'src/providers/reportNonNativeFunctions/report';
import { flags } from '@inject';
import { DEBUG_CONSOLE_FEATURE } from 'generated/features';
import type { AnyConstructor, AnyFunc } from '../types';
import { isNativeFn } from './isNativeFn';

export const isNativeFunction = (
    functionName: string,
    fn: AnyFunc | AnyConstructor,
) => {
    const isNative = isNativeFn(functionName, fn);
    if (flags[DEBUG_CONSOLE_FEATURE]) {
        if (fn && !isNative) {
            reportNonNativeFunction(fn, functionName);
        }
    }

    return isNative;
};
