import { flags } from '@inject';
import { providersAsync } from 'src/providersEntrypoint';
import { checkStatus } from './statusCheck';

export const initProvider = () => {
    if (flags.CHECK_STATUS_FEATURE) {
        providersAsync.push(checkStatus);
    }
};
