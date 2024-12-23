import { getGlobalStorage } from 'src/storage/global/getGlobal';
import { argsToArray } from 'src/utils/function/args';
import {
    METHODS_TELEMETRY_KEYS_MAP,
    METHODS_TELEMETRY_GLOBAL_STORAGE_KEY,
} from './const';
import type { Decorator } from '../types';

export const telemetryCallCountDecorator: Decorator<unknown> = (
    ctx,
    counterOptions,
    methodName,
    fn,
) => {
    const methodKey = METHODS_TELEMETRY_KEYS_MAP[methodName];
    if (methodKey) {
        return function telemetry() {
            // eslint-disable-next-line prefer-rest-params
            const fnArgs = argsToArray(arguments);
            const result = fn(...fnArgs);
            const globalStorage = getGlobalStorage(ctx);
            globalStorage.setSafe(METHODS_TELEMETRY_GLOBAL_STORAGE_KEY, {});
            const methodsCallCounters: Record<string, number> =
                globalStorage.getVal(METHODS_TELEMETRY_GLOBAL_STORAGE_KEY);
            const previouslyCalled = methodsCallCounters[methodKey];
            methodsCallCounters[methodKey] = previouslyCalled
                ? previouslyCalled + 1
                : 1;
            return result;
        };
    }

    return fn;
};
