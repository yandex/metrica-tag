import { flags } from '@inject';
import { SUBMIT_TRACKING_FEATURE } from 'generated/features';
import { providersSync } from 'src/providersEntrypoint';
import { useSubmitTracking } from './submitTracking';

export const initProvider = () => {
    if (flags[SUBMIT_TRACKING_FEATURE]) {
        providersSync.push(useSubmitTracking);
    }
};
