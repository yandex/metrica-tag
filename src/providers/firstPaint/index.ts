import { flags } from '@inject';
import { FIRST_PAINT_FEATURE } from 'generated/features';
import { FIRST_PAINT_BR_KEY } from 'src/api/watch';
import { BRINFO_FLAG_GETTERS } from 'src/middleware/watchSyncFlags/brinfoFlags';
import { windowProviderInitializers } from 'src/providersEntrypoint';
import { firstPaint, useFirstPaint } from './firstPaint';

export const initProvider = () => {
    if (flags[FIRST_PAINT_FEATURE]) {
        windowProviderInitializers.unshift(useFirstPaint);
        BRINFO_FLAG_GETTERS[FIRST_PAINT_BR_KEY] = firstPaint;
    }
};
