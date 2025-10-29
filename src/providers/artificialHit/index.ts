import { flags } from '@inject';
import { providerMiddlewareList } from 'src/middleware';
import { counterFirstHit } from 'src/middleware/counterFirstHit/counterFirstHit';
import { pageTitle } from 'src/middleware/pageTitle/pageTitle';
import { prepareUrlMiddleware } from 'src/middleware/prepareUrl/prepareUrl';
import { prerender } from 'src/middleware/prerender/prerender';
import { watchSyncFlags } from 'src/middleware/watchSyncFlags';
import { providersSync } from 'src/providersEntrypoint';
import { providerMap } from 'src/sender';
import { type SenderWatch, useSenderWatch } from 'src/sender/watch';
import { hitTransports, nameMap } from 'src/transport';
import { ctxErrorLogger } from 'src/utils/errorLogger/errorLogger';
import { artificialHitProvider } from './artificialHit';
import { ARTIFICIAL_HIT_PROVIDER } from './const';

declare module 'src/providers/index' {
    interface PROVIDERS {
        ARTIFICIAL_HIT_PROVIDER: typeof ARTIFICIAL_HIT_PROVIDER;
    }
}
declare module 'src/sender/types' {
    interface NameMap {
        [ARTIFICIAL_HIT_PROVIDER]: SenderWatch;
    }
}

export const initProvider = () => {
    if (flags.ARTIFICIAL_HIT_FEATURE) {
        providersSync.push(ctxErrorLogger('p.ar', artificialHitProvider));
        providerMap[ARTIFICIAL_HIT_PROVIDER] = useSenderWatch;
        providerMiddlewareList[ARTIFICIAL_HIT_PROVIDER] = [
            [prepareUrlMiddleware, -100],
            [prerender, 1],
            [counterFirstHit, 2],
            [watchSyncFlags(), 3],
            [pageTitle, 4],
        ];
        nameMap[ARTIFICIAL_HIT_PROVIDER] = hitTransports;
    }
};
