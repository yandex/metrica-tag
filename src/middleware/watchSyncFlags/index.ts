import { flags } from '@inject';
import type { MiddlewareGetter } from 'src/middleware/types';
import type { SenderInfo } from 'src/sender/SenderInfo';
import type { CounterOptions } from 'src/utils/counterOptions';
import { cForEach } from 'src/utils/array/map';
import { arrayMerge } from 'src/utils/array/merge';
import { memo } from 'src/utils/function/memo';
import { cKeys } from 'src/utils/object';
import { ctxErrorLogger } from 'src/utils/errorLogger/errorLogger';
import { addTelemetryToSenderParams } from 'src/utils/telemetry/telemetry';
import { TELEMETRY_FLAG_GETTERS } from './telemetryFlags';
import { BRINFO_FLAG_GETTERS } from './brinfoFlags';
import { BRINFO_LOGGER_PREFIX } from './const';

const getDefaultFlags = memo(() =>
    arrayMerge(cKeys(BRINFO_FLAG_GETTERS), cKeys(TELEMETRY_FLAG_GETTERS)),
);

/**
 * Constructs a middleware that fills in brInfo and telemetry
 */
export const watchSyncFlags = (inputFlags?: string[]): MiddlewareGetter =>
    function watchSyncFlagsMiddleware(ctx: Window, opt: CounterOptions) {
        return {
            beforeRequest: (senderParams: SenderInfo, next: () => void) => {
                const { brInfo, urlParams } = senderParams;
                if (!brInfo || !urlParams) {
                    next();
                    return;
                }

                cForEach((flag: string) => {
                    let getter = BRINFO_FLAG_GETTERS[flag];
                    let loggerPrefix = BRINFO_LOGGER_PREFIX;
                    let storage = brInfo;
                    if (flags.TELEMETRY_FEATURE) {
                        if (!getter) {
                            getter = TELEMETRY_FLAG_GETTERS[flag];
                            loggerPrefix = 'tel';
                            storage = addTelemetryToSenderParams(senderParams);
                        }
                    }

                    if (getter) {
                        const flagValue = ctxErrorLogger(
                            `${loggerPrefix}:${flag}`,
                            getter,
                            null,
                        )(ctx, opt, senderParams);
                        storage.setOrNot(flag, flagValue);
                    }
                }, inputFlags || getDefaultFlags());

                next();
            },
        };
    };
