import { flags } from '@inject';
import {
    ACCURATE_TRACK_BOUNCE_METHOD_FEATURE,
    CLICK_MAP_FEATURE,
    CLICK_MAP_METHOD_FEATURE,
    ENABLE_ALL_METHOD_FEATURE,
    EXTERNAL_LINK_FEATURE,
    NOT_BOUNCE_HIT_FEATURE,
} from 'generated/features';
import { providersSync } from 'src/providersEntrypoint';
import { useEnableAllProvider } from './enableAll';

export const initProvider = () => {
    if (
        (flags[CLICK_MAP_FEATURE] ||
            flags[CLICK_MAP_METHOD_FEATURE] ||
            flags[EXTERNAL_LINK_FEATURE] ||
            flags[NOT_BOUNCE_HIT_FEATURE] ||
            flags[ACCURATE_TRACK_BOUNCE_METHOD_FEATURE]) &&
        flags[ENABLE_ALL_METHOD_FEATURE]
    ) {
        providersSync.push(useEnableAllProvider);
    }
};
