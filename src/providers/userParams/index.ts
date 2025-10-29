import { flags } from '@inject';
import { addCommonMiddleware, addMiddlewareForProvider } from 'src/middleware';
import { userParamsMiddleware } from 'src/middleware/userParams';
import { HIT_PROVIDER } from 'src/providers/index';
import { providersSync } from 'src/providersEntrypoint';
import { ARTIFICIAL_HIT_PROVIDER } from '../artificialHit/const';
import { METHOD_NAME_USER_PARAMS } from './const';
import type { UserParamsHandler } from './types';
import { userParams } from './userParams';

declare module 'src/utils/counter/type' {
    interface CounterObject {
        [METHOD_NAME_USER_PARAMS]?: UserParamsHandler<CounterObject>;
    }
}

export const initProvider = () => {
    if (flags.USER_PARAMS_FEATURE) {
        providersSync.push(userParams);
        addCommonMiddleware(userParamsMiddleware, 0);
        addMiddlewareForProvider(HIT_PROVIDER, userParamsMiddleware, 0);
        if (flags.ARTIFICIAL_HIT_FEATURE) {
            addMiddlewareForProvider(
                ARTIFICIAL_HIT_PROVIDER,
                userParamsMiddleware,
                0,
            );
        }
    }
};
