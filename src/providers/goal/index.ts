import { flags } from '@inject';
import { GOAL_FEATURE } from 'generated/features';
import { providersSync } from 'src/providersEntrypoint';
import { SenderWatch, useSenderWatch } from 'src/sender/watch';
import { providerMap } from 'src/sender';
import { fullList, nameMap } from 'src/transport';
import { commonMiddlewares, providerMiddlewareList } from 'src/middleware';
import { GOAL_PROVIDER } from './const';
import { useGoal } from './goal';

declare module 'src/providers/index' {
    interface PROVIDERS {
        GOAL_PROVIDER: typeof GOAL_PROVIDER;
    }
}
declare module 'src/sender/types' {
    interface NameMap {
        [GOAL_PROVIDER]: SenderWatch;
    }
}

export const initProvider = () => {
    if (flags[GOAL_FEATURE]) {
        providersSync.push(useGoal);
        providerMap[GOAL_PROVIDER] = useSenderWatch;
        nameMap[GOAL_PROVIDER] = fullList;
        providerMiddlewareList[GOAL_PROVIDER] = commonMiddlewares;
    }
};
