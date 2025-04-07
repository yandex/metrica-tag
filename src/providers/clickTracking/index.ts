import { flags } from '@inject';
import { providersSync } from 'src/providersEntrypoint';
import { useClickTracking } from './clickTracking';

declare module 'src/utils/counterSettings/types' {
    interface CounterSettingsParams {
        /** button goals enabled */
        // eslint-disable-next-line camelcase
        button_goals?: number;
    }
}

export const initProvider = () => {
    if (flags.CLICK_TRACKING_FEATURE) {
        providersSync.push(useClickTracking);
    }
};
