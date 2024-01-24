import { flags } from '@inject';
import { ARTIFICIAL_HIT_FEATURE, PREPROD_FEATURE } from 'generated/features';
import { commonMiddlewares, providerMiddlewareList } from 'src/middleware';
import { providersSync } from 'src/providersEntrypoint';
import { providerMap } from 'src/sender';
import { SenderWatch, useSenderWatch } from 'src/sender/watch';
import { fullList, nameMap, withoutBeacon } from 'src/transport';
import { ctxErrorLogger } from 'src/utils/errorLogger';
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
        if (flags[PREPROD_FEATURE]) {
            // Needs to check safety usage of sendBeacon API in the artificial hit https://st.yandex-team.ru/METR-57359
            nameMap[ARTIFICIAL_HIT_PROVIDER] = fullList;
        } else {
            nameMap[ARTIFICIAL_HIT_PROVIDER] = withoutBeacon;
        }
    }
};
