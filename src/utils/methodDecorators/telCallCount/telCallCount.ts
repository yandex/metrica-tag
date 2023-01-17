import { CounterOptions } from 'src/utils/counterOptions';
import { getGlobalStorage } from 'src/storage/global';
import { throwFunction } from 'src/utils/errorLogger/throwFunction';
import {
    METHODS_TELEMETRY_KEYS_MAP,
    METHODS_TELEMETRY_GLOBAL_STORAGE_KEY,
} from './consts';
import { argsToArray } from '../../function/args';

export function telemetryCallCountDecorator<
    FN extends (...args: any) => ReturnType<FN>,
>(ctx: Window, counterOptions: CounterOptions, methodName: string, fn: FN) {
    const methodKey = METHODS_TELEMETRY_KEYS_MAP[methodName];
    if (methodKey) {
        return function telemetry() {
            let result;
            // eslint-disable-next-line prefer-rest-params
            const fnArgs = argsToArray(arguments);
            try {
                result = fn(...fnArgs);
                const globalStorage = getGlobalStorage(ctx);
                globalStorage.setSafe(METHODS_TELEMETRY_GLOBAL_STORAGE_KEY, {});
                const methodsCallCounters: Record<string, number> =
                    globalStorage.getVal(METHODS_TELEMETRY_GLOBAL_STORAGE_KEY);
                const previouslyCalled = methodsCallCounters[methodKey];
                methodsCallCounters[methodKey] = previouslyCalled
                    ? previouslyCalled + 1
                    : 1;
            } catch (e) {
                throwFunction(e as Error);
            }
            return result;
        };
    }

    return fn;
}
