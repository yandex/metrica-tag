import { flags } from '@inject';
import { providersSync } from 'src/providersEntrypoint';
import { useClickmapMethodProvider } from './clickmapMethod';

export const initProvider = () => {
    if (
        flags.CLICK_MAP_FEATURE &&
        flags.CLICK_MAP_METHOD_FEATURE &&
        !flags.SENDER_COLLECT_FEATURE
    ) {
        providersSync.push(useClickmapMethodProvider);
    }
};
