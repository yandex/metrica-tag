import { CSRF_TOKEN_URL_PARAM } from 'src/api/common';
import type { MiddlewareGetter } from 'src/middleware/types';
import type { UrlParams } from 'src/sender/SenderInfo';
import { getPath, mix } from 'src/utils/object';
import { isFirstHit } from 'src/middleware/counterFirstHit';
import {
    CounterSettings,
    COUNTER_SETTINGS_SETTINGS_KEY,
    getCounterSettings,
} from 'src/utils/counterSettings';

export const CSRF_TOKEN_SETTINGS_KEY = CSRF_TOKEN_URL_PARAM;

/**
 * Retrieve token from settings storage and add it to URL parameters.
 */
export const csrfMiddleware: MiddlewareGetter = (ctx, counterOptions) => ({
    beforeRequest: (senderParams, next) => {
        if (isFirstHit(senderParams)) {
            next();
            return;
        }

        getCounterSettings<void>(
            counterOptions,
            (settings: CounterSettings) => {
                const token = getPath(
                    settings,
                    `${COUNTER_SETTINGS_SETTINGS_KEY}.${CSRF_TOKEN_SETTINGS_KEY}`,
                );

                if (token) {
                    const csrfUrlParam: UrlParams = {
                        [CSRF_TOKEN_URL_PARAM]: token,
                    };

                    const { urlParams } = senderParams;
                    senderParams.urlParams = mix(urlParams || {}, csrfUrlParam);
                }

                next();
            },
        );
    },
});
