import { flags } from '@inject';
import { CSRF_TOKEN_SETTINGS_KEY, csrfMiddleware } from 'src/middleware/csrf';
import {
    addCommonMiddleware,
    addMiddlewareForProvider,
} from 'src/middleware/providerMiddlewares';
import { HIT_PROVIDER } from 'src/providers';
import { NOT_BOUNCE_HIT_PROVIDER } from 'src/providers/notBounce/const';
import { ARTIFICIAL_HIT_PROVIDER } from '../artificialHit/const';
import { PARAMS_PROVIDER } from '../params/const';

declare module 'src/utils/counterSettings/types' {
    interface CounterSettingsParams {
        /** A token for signing all requests to the watch/ route */
        [CSRF_TOKEN_SETTINGS_KEY]?: string;
    }
}

/**
 * Initialize the csrf middleware. No actual provider exists for the feature.
 */
export const initProvider = () => {
    if (flags.CSRF_TOKEN_FEATURE) {
        addCommonMiddleware(csrfMiddleware, 20);
        addMiddlewareForProvider(HIT_PROVIDER, csrfMiddleware, 20);
        if (flags.ARTIFICIAL_HIT_FEATURE) {
            addMiddlewareForProvider(
                ARTIFICIAL_HIT_PROVIDER,
                csrfMiddleware,
                20,
            );
        }

        if (flags.NOT_BOUNCE_HIT_FEATURE) {
            addMiddlewareForProvider(
                NOT_BOUNCE_HIT_PROVIDER,
                csrfMiddleware,
                20,
            );
        }

        if (flags.PARAMS_FEATURE) {
            addMiddlewareForProvider(PARAMS_PROVIDER, csrfMiddleware, 20);
        }
    }
};
