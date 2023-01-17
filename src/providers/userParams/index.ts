import { flags } from '@inject';
import { USER_PARAMS_FEATURE } from 'generated/features';
import { addCommonMiddleware } from 'src/middleware';
import { userParamsMiddleware } from 'src/middleware/userParams';
import { providersSync } from 'src/providersEntrypoint';
import { userParams } from './userParams';

export const initProvider = () => {
    if (flags[USER_PARAMS_FEATURE]) {
        providersSync.push(userParams);
        addCommonMiddleware(userParamsMiddleware, 0);
    }
};
