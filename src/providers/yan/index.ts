import { flags } from '@inject';
import { providersSync } from 'src/providersEntrypoint';
import { useYan } from './yan';

export const initProvider = () => {
    if (flags.YAN_FEATURE) {
        providersSync.push(useYan);
    }
};
