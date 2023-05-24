import { flags } from '@inject';
import { SET_USER_ID_FEATURE } from 'generated/features';
import { providersSync } from 'src/providersEntrypoint';
import { YM_LOG_WHITELIST_KEYS } from 'src/providers/params/const';
import { USER_ID_PARAM } from './const';
import { setUserID } from './setUserID';

export const initProvider = () => {
    if (flags[SET_USER_ID_FEATURE]) {
        providersSync.push(setUserID);
        YM_LOG_WHITELIST_KEYS.push(USER_ID_PARAM);
    }
};
