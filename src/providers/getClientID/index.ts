import { flags } from '@inject';
import { GET_CLIENT_ID_FEATURE } from 'generated/features';
import { providersSync } from 'src/providersEntrypoint';
import { getClientID } from './getClientID';

export const initProvider = () => {
    if (flags[GET_CLIENT_ID_FEATURE]) {
        providersSync.push(getClientID);
    }
};
