import { flags } from '@inject';
import { SET_USER_ID_FEATURE } from 'generated/features';
import { providersSync } from 'src/providersEntrypoint';
import { setUserID } from './setUserID';

export const initProvider = () => {
    if (flags[SET_USER_ID_FEATURE]) {
        providersSync.push(setUserID);
    }
};
