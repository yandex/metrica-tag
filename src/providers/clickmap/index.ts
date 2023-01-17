import { flags } from '@inject';
import { CLICK_MAP_FEATURE } from 'generated/features';
import { providersSync } from 'src/providersEntrypoint';
import { nameMap, queryStringTransports } from 'src/transport';
import { SenderClickmap, useSenderClickMap } from 'src/sender/clickmap';
import { providerMap } from 'src/sender';
import { retransmit } from 'src/middleware/retransmit';
import { watchSyncFlags } from 'src/middleware/watchSyncFlags';
import {
    BUILD_FLAGS_BR_KEY,
    BUILD_VERSION_BR_KEY,
    UID_BR_KEY,
} from 'src/api/watch';
import { addMiddlewareForProvider } from 'src/middleware';
import { useClickmapProvider } from './clickmap';
import { CLICKMAP_PROVIDER, TClickMapParams } from './constants';
import { addCounterOptions } from '../counterOptions';

declare module 'src/providers/index' {
    interface PROVIDERS {
        /** Functionality for sending information about clicks to build heat map of clicks */
        CLICKMAP_PROVIDER: typeof CLICKMAP_PROVIDER;
    }
}
declare module 'src/sender/types' {
    interface NameMap {
        /** Sender for heat map of clicks */
        [CLICKMAP_PROVIDER]: SenderClickmap;
    }
}

declare module 'src/utils/counterOptions/types' {
    interface CounterOptions {
        /** Params for heat map of clicks or flag to disable */
        clickmap?: TClickMapParams;
    }
}

export const initProvider = () => {
    if (flags[CLICK_MAP_FEATURE]) {
        providersSync.push(useClickmapProvider);
        providerMap[CLICKMAP_PROVIDER] = useSenderClickMap;
        nameMap[CLICKMAP_PROVIDER] = queryStringTransports;
        addMiddlewareForProvider(
            CLICKMAP_PROVIDER,
            watchSyncFlags([
                UID_BR_KEY,
                BUILD_VERSION_BR_KEY,
                BUILD_FLAGS_BR_KEY,
            ]),
            1,
        );
        addMiddlewareForProvider(CLICKMAP_PROVIDER, retransmit, 2);
        addCounterOptions({
            clickmap: {
                optKey: 'clickmap',
            },
        });
    }
};
