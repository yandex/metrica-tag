import { flags } from '@inject';
import { providersSync } from 'src/providersEntrypoint';
import { useEnableAllProvider } from './enableAll';

export const initProvider = () => {
    if (
        (flags.CLICK_MAP_FEATURE ||
            flags.CLICK_MAP_METHOD_FEATURE ||
            flags.EXTERNAL_LINK_FEATURE ||
            flags.NOT_BOUNCE_HIT_FEATURE ||
            flags.ACCURATE_TRACK_BOUNCE_METHOD_FEATURE) &&
        flags.ENABLE_ALL_METHOD_FEATURE
    ) {
        providersSync.push(useEnableAllProvider);
    }
};
