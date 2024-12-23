import { flags } from '@inject';
import { ARTIFICIAL_HIT_FEATURE } from 'generated/features';
import { commonMiddlewares, providerMiddlewareList } from 'src/middleware';
import { providersSync } from 'src/providersEntrypoint';
import { providerMap } from 'src/sender';
import { SenderWatch, useSenderWatch } from 'src/sender/watch';
import { fullList, nameMap } from 'src/transport';
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
    if (flags[ARTIFICIAL_HIT_FEATURE]) {
        providersSync.push(ctxErrorLogger('p.ar', artificialHitProvider));
        providerMap[ARTIFICIAL_HIT_PROVIDER] = useSenderWatch;
        providerMiddlewareList[ARTIFICIAL_HIT_PROVIDER] = commonMiddlewares;
        nameMap[ARTIFICIAL_HIT_PROVIDER] = fullList;
    }
};
