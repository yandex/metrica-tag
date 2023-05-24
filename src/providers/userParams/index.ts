import { flags } from '@inject';
import { USER_PARAMS_FEATURE } from 'generated/features';
import { addCommonMiddleware } from 'src/middleware';
import { userParamsMiddleware } from 'src/middleware/userParams';
import { providersSync } from 'src/providersEntrypoint';
import { METHOD_NAME_USER_PARAMS } from './const';
import { UserParamsHandler } from './types';
import { userParams } from './userParams';

declare module 'src/utils/counter/type' {
    interface CounterObject {
        [METHOD_NAME_USER_PARAMS]?: UserParamsHandler<CounterObject>;
    }
}

export const initProvider = () => {
    if (flags[USER_PARAMS_FEATURE]) {
        providersSync.push(userParams);
        addCommonMiddleware(userParamsMiddleware, 0);
    }
};
