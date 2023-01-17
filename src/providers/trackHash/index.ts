import { flags } from '@inject';
import { TRACK_HASH_FEATURE } from 'generated/features';
import { commonMiddlewares, providerMiddlewareList } from 'src/middleware';
import { providersSync } from 'src/providersEntrypoint';
import { providerMap } from 'src/sender';
import { useSenderWatch, SenderWatch } from 'src/sender/watch';
import { fullList, nameMap } from 'src/transport';
import { TRACK_HASH_PROVIDER } from './const';
import { useTrackHash } from './trackHash';

declare module 'src/providers/index' {
    interface PROVIDERS {
        /** Tracks URL hash change */
        TRACK_HASH_PROVIDER: typeof TRACK_HASH_PROVIDER;
    }
}
declare module 'src/sender/types' {
    interface NameMap {
        /** Tracks URL hash change */
        [TRACK_HASH_PROVIDER]: SenderWatch;
    }
}

export const initProvider = () => {
    if (flags[TRACK_HASH_FEATURE]) {
        providersSync.push(useTrackHash);
        providerMiddlewareList[TRACK_HASH_PROVIDER] = commonMiddlewares;
        providerMap[TRACK_HASH_PROVIDER] = useSenderWatch;
        nameMap[TRACK_HASH_PROVIDER] = fullList;
    }
};
