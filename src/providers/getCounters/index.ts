import { flags } from '@inject';
import {
    beforeHitProviders,
    staticMethodInitializers,
} from 'src/providersEntrypoint';
import { getGlobalStorage } from 'src/storage/global/getGlobal';
import { telemetryCallCountDecorator } from 'src/utils/methodDecorators/telCallCount';
import { METHODS_TELEMETRY_KEYS_MAP } from 'src/utils/methodDecorators/telCallCount/const';
import type { CounterOptions } from 'src/utils/counterOptions/types';
import {
    GLOBAL_COUNTERS_METHOD_NAME,
    METHOD_NAME_COUNTERS,
    TELEMETRY_KEY_COUNTERS_CTOR,
    TELEMETRY_KEY_COUNTERS_STORE,
} from './const';
import { createCountersGetter, getCountersProvider } from './getCounters';
import { GetCountersMethod } from './types';

declare module 'src/types' {
    interface MetrikaCounter {
        /** External method Ya.Metrika.counters() for getting list of initialized counters */
        [METHOD_NAME_COUNTERS]?: GetCountersMethod;
    }
}

export const initProvider = () => {
    const globalStorage = getGlobalStorage(window);
    const isRemoteControlOrCheckStatusFeature =
        flags.REMOTE_CONTROL_FEATURE ||
        flags.GET_COUNTERS_FEATURE ||
        flags.CHECK_STATUS_FEATURE;

    if (isRemoteControlOrCheckStatusFeature) {
        globalStorage.setSafe(
            GLOBAL_COUNTERS_METHOD_NAME,
            createCountersGetter(window),
        );
        beforeHitProviders.push(getCountersProvider);
    }

    if (flags.COUNTERS_FEATURE) {
        METHODS_TELEMETRY_KEYS_MAP[TELEMETRY_KEY_COUNTERS_CTOR] = 'cntc';
        METHODS_TELEMETRY_KEYS_MAP[TELEMETRY_KEY_COUNTERS_STORE] = 'cnts';

        staticMethodInitializers.push(
            (ctx: Window, counterConstructor, staticMethodsStore) => {
                const rawMethod = globalStorage.getVal(
                    GLOBAL_COUNTERS_METHOD_NAME,
                ) as GetCountersMethod | undefined;
                if (!rawMethod) {
                    return;
                }

                const ctorMethod = telemetryCallCountDecorator(
                    ctx,
                    {} as CounterOptions,
                    TELEMETRY_KEY_COUNTERS_CTOR,
                    rawMethod,
                ) as GetCountersMethod;
                counterConstructor[METHOD_NAME_COUNTERS] = ctorMethod;

                const storeMethod = telemetryCallCountDecorator(
                    ctx,
                    {} as CounterOptions,
                    TELEMETRY_KEY_COUNTERS_STORE,
                    rawMethod,
                ) as GetCountersMethod;
                staticMethodsStore[METHOD_NAME_COUNTERS] = storeMethod;
            },
        );
    }
};
