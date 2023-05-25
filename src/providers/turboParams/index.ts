import { flags } from '@inject';
import { TURBO_PARAMS_FEATURE } from 'generated/features';
import { IS_TURBO_PAGE_BR_KEY, TURBO_PAGE_ID_BR_KEY } from 'src/api/watch';
import { BRINFO_FLAG_GETTERS } from 'src/middleware/watchSyncFlags/brinfoFlags';
import { FlagGettersHash } from 'src/middleware/watchSyncFlags/const';
import { INTERNAL_PARAMS_KEY } from 'src/providers/params/const';
import { toOneOrNull } from 'src/utils/boolean';
import { pipe, secondArg } from 'src/utils/function';
import { mix } from 'src/utils/object';
import { getTurboPageId, isTurboPage } from 'src/utils/turboParams';

declare module 'src/utils/counterOptions/types' {
    interface Params {
        /** Turbo page settings */
        [INTERNAL_PARAMS_KEY]?: Record<string, unknown>;
    }
}

/**
 * Initialize the turbo params brInfo flags.
 */
export const initProvider = () => {
    if (flags[TURBO_PARAMS_FEATURE]) {
        const TURBO_PARAMS_BRINFO_FLAG_GETTERS: FlagGettersHash = {
            [IS_TURBO_PAGE_BR_KEY]: pipe(secondArg, isTurboPage, toOneOrNull),
            [TURBO_PAGE_ID_BR_KEY]: pipe(secondArg, getTurboPageId),
        };
        mix(BRINFO_FLAG_GETTERS, TURBO_PARAMS_BRINFO_FLAG_GETTERS);
    }
};
