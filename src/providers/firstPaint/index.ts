import { flags } from '@inject';
import { FIRST_PAINT_FEATURE } from 'generated/features';
import { windowProviderInitializers } from 'src/providersEntrypoint';
import { useFirstPaint } from './firstPaint';

export const initProvider = () => {
    if (flags[FIRST_PAINT_FEATURE]) {
        windowProviderInitializers.push(useFirstPaint);
    }
};
