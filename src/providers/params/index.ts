import { flags } from '@inject';
import { PARAMS_FEATURE } from 'generated/features';
import { addCommonMiddleware, providerMiddlewareList } from 'src/middleware';
import { counterFirstHit } from 'src/middleware/counterFirstHit';
import { paramsMiddleware } from 'src/middleware/params';
import { prerender } from 'src/middleware/prerender';
import { watchSyncFlags } from 'src/middleware/watchSyncFlags';
import { providersSync } from 'src/providersEntrypoint';
import { providerMap } from 'src/sender';
import { SenderWatch, useSenderWatch } from 'src/sender/watch';
import { fullList, nameMap } from 'src/transport';
import { PARAMS_PROVIDER } from './const';
import { useParams } from './params';

declare module 'src/providers/index' {
    interface PROVIDERS {
        PARAMS_PROVIDER: typeof PARAMS_PROVIDER;
    }
}

declare module 'src/sender/types' {
    interface NameMap {
        [PARAMS_PROVIDER]: SenderWatch;
    }
}

export const initProvider = () => {
    if (flags[PARAMS_FEATURE]) {
        providerMap[PARAMS_PROVIDER] = useSenderWatch;
        providersSync.push(useParams);
        nameMap[PARAMS_PROVIDER] = fullList;
        addCommonMiddleware(paramsMiddleware, -1);
        providerMiddlewareList[PARAMS_PROVIDER] = [
            [paramsMiddleware, -1],
            [prerender, 1],
            [counterFirstHit, 2],
            [watchSyncFlags(), 3],
        ];
    }
};
