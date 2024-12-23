import { flags } from '@inject';
import {
    CHECK_STATUS_FEATURE,
    COUNTERS_FEATURE,
    GET_COUNTERS_FEATURE,
    REMOTE_CONTROL_FEATURE,
} from 'generated/features';
import {
    beforeHitProviders,
    staticMethodInitializers,
} from 'src/providersEntrypoint';
import { getGlobalStorage } from 'src/storage/global/getGlobal';
import { StaticMethodInitializer } from 'src/types';
import { GLOBAL_COUNTERS_METHOD_NAME, METHOD_NAME_COUNTERS } from './const';
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
        flags[REMOTE_CONTROL_FEATURE] ||
        flags[GET_COUNTERS_FEATURE] ||
        flags[CHECK_STATUS_FEATURE];

    if (isRemoteControlOrCheckStatusFeature) {
        globalStorage.setSafe(
            GLOBAL_COUNTERS_METHOD_NAME,
            createCountersGetter(window),
        );
        beforeHitProviders.push(getCountersProvider);
    }

    if (flags[COUNTERS_FEATURE]) {
        staticMethodInitializers.push(((ctx: Window, counterConstructor) => {
            counterConstructor[METHOD_NAME_COUNTERS] = globalStorage.getVal(
                GLOBAL_COUNTERS_METHOD_NAME,
            ) as GetCountersMethod;
        }) as StaticMethodInitializer);
    }
};
