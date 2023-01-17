import { flags } from '@inject';
import {
    CLICK_MAP_FEATURE,
    CLICK_MAP_METHOD_FEATURE,
} from 'generated/features';
import { providersSync } from 'src/providersEntrypoint';
import { useClickmapMethodProvider } from './clickmapMethod';

export const initProvider = () => {
    if (flags[CLICK_MAP_FEATURE] && flags[CLICK_MAP_METHOD_FEATURE]) {
        providersSync.push(useClickmapMethodProvider);
    }
};
