import { reportNonNativeFunction } from 'src/providers/reportNonNativeFunctions/report';
import { flags } from '@inject';
import { DEBUG_CONSOLE_FEATURE } from 'generated/features';
import { isNativeFn } from './isNativeFn';

export const isNativeFunction = (functionName: string, fn: Function) => {
    const isNative = isNativeFn(functionName, fn);
    if (flags[DEBUG_CONSOLE_FEATURE]) {
        if (fn && !isNative) {
            reportNonNativeFunction(fn, functionName);
        }
    }

    return isNative;
};
