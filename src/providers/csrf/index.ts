import {
    CSRF_TOKEN_FEATURE,
    NOT_BOUNCE_HIT_FEATURE,
    PARAMS_FEATURE,
} from 'generated/features';
import { flags } from '@inject';
import { csrfMiddleware, CSRF_TOKEN_SETTINGS_KEY } from 'src/middleware/csrf';
import {
    addCommonMiddleware,
    addMiddlewareForProvider,
} from 'src/middleware/providerMiddlewares';
import { Provider } from 'src/providers/index';
import { NOT_BOUNCE_HIT_PROVIDER } from 'src/providers/notBounce/const';
import { PARAMS_PROVIDER } from 'src/providers/params/const';

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
    if (flags[CSRF_TOKEN_FEATURE]) {
        addCommonMiddleware(csrfMiddleware, 20);

        const addCsrfMiddlewareForProvider = (provider: Provider) => {
            addMiddlewareForProvider(provider, csrfMiddleware, 20);
        };

        if (flags[NOT_BOUNCE_HIT_FEATURE]) {
            addCsrfMiddlewareForProvider(NOT_BOUNCE_HIT_PROVIDER);
        }

        if (flags[PARAMS_FEATURE]) {
            addCsrfMiddlewareForProvider(PARAMS_PROVIDER);
        }
    }
};
