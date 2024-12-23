import { flags } from '@inject';
import { EXTERNAL_LINK_FEATURE } from 'generated/features';
import { commonMiddlewares, providerMiddlewareList } from 'src/middleware';
import { providersSync } from 'src/providersEntrypoint';
import { providerMap } from 'src/sender';
import { SenderWatch, useSenderWatch } from 'src/sender/watch';
import { fullList, nameMap } from 'src/transport';
import { ctxErrorLogger } from 'src/utils/errorLogger/errorLogger';
import { useClicksProvider } from './clicks';
import { LINK_CLICK_HIT_PROVIDER } from './const';

declare module 'src/providers/index' {
    interface PROVIDERS {
        LINK_CLICK_HIT_PROVIDER: typeof LINK_CLICK_HIT_PROVIDER;
    }
}
declare module 'src/sender/types' {
    interface NameMap {
        [LINK_CLICK_HIT_PROVIDER]: SenderWatch;
    }
}

export const initProvider = () => {
    if (flags[EXTERNAL_LINK_FEATURE]) {
        providersSync.push(ctxErrorLogger('cl.p', useClicksProvider));
        providerMiddlewareList[LINK_CLICK_HIT_PROVIDER] = commonMiddlewares;
        providerMap[LINK_CLICK_HIT_PROVIDER] = useSenderWatch;
        nameMap[LINK_CLICK_HIT_PROVIDER] = fullList;
    }
};
