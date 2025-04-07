import { flags } from '@inject';
import { ProviderFunction } from 'src/types';
import { addMiddlewareForProvider } from 'src/middleware';
import { counterFirstHit } from 'src/middleware/counterFirstHit';
import { prepareUrlMiddleware } from 'src/middleware/prepareUrl/prepareUrl';
import { prerender } from 'src/middleware/prerender';
import { watchSyncFlags } from 'src/middleware/watchSyncFlags';
import { providersSync } from 'src/providersEntrypoint';
import { providerMap } from 'src/sender';
import { SenderWatch, useSenderWatch } from 'src/sender/watch';
import { fullList, nameMap } from 'src/transport';
import { addCounterOptions } from '../counterOptions';
import { NOT_BOUNCE_HIT_PROVIDER } from './const';
import { useNotBounceProvider } from './notBounce';

declare module 'src/providers/index' {
    interface PROVIDERS {
        /** Sends a technical hit indicating that the user spent sufficient amount of time on the page */
        NOT_BOUNCE_HIT_PROVIDER: typeof NOT_BOUNCE_HIT_PROVIDER;
    }
}

declare module 'src/utils/counterOptions/types' {
    interface CounterOptions {
        /** Send not bounce event in strict timeout. Not bounce means that user spent sufficient amount of time on the page */
        accurateTrackBounce?: boolean | number;
    }
}

declare module 'src/sender/types' {
    interface NameMap {
        /** Sends a technical hit indicating that the user spent sufficient amount of time on the page */
        [NOT_BOUNCE_HIT_PROVIDER]: SenderWatch;
    }
}

export const initProvider = () => {
    if (flags.NOT_BOUNCE_HIT_FEATURE) {
        providersSync.push(useNotBounceProvider as ProviderFunction);
        addMiddlewareForProvider(NOT_BOUNCE_HIT_PROVIDER, prerender, 1);
        addMiddlewareForProvider(NOT_BOUNCE_HIT_PROVIDER, counterFirstHit, 2);
        addMiddlewareForProvider(NOT_BOUNCE_HIT_PROVIDER, watchSyncFlags(), 3);
        addMiddlewareForProvider(
            NOT_BOUNCE_HIT_PROVIDER,
            prepareUrlMiddleware,
            3,
        );
        providerMap[NOT_BOUNCE_HIT_PROVIDER] = useSenderWatch;
        nameMap[NOT_BOUNCE_HIT_PROVIDER] = fullList;
        addCounterOptions({
            accurateTrackBounce: {
                optKey: 'accurateTrackBounce',
            },
        });
    }
};
