import { waitForBodyTask } from 'src/utils/dom/waitForBody';
import { globalMemoWin, equal, pipe, noop, bindArgs } from 'src/utils/function';
import { taskFork } from 'src/utils/async';
import { CounterOptions } from 'src/utils/counterOptions';
import {
    getCounterSettings,
    COUNTER_SETTINGS_SETTINGS_KEY,
    CounterSettings,
} from 'src/utils/counterSettings';
import { ctxPath } from 'src/utils/object';
import { isMobile } from 'src/utils/browser';
import { siteStatisticsLayout } from './layout/siteStatisticsLayout';

export const STATISTICS_MODE_KEY = 'sm';

export const isSiteStatisticsEnabled: (a: CounterSettings) => boolean = pipe(
    ctxPath(`${COUNTER_SETTINGS_SETTINGS_KEY}.${STATISTICS_MODE_KEY}`),
    equal(1),
);

/**
 * Show Metrica web interface in iframe over site layout
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 */
export const getSiteStatisticsProvider = globalMemoWin<void>(
    'siteStatistics',
    (ctx: Window, counterOptions: CounterOptions) => {
        if (!isMobile(ctx)) {
            return waitForBodyTask(ctx)(
                taskFork(
                    noop,
                    bindArgs(
                        [
                            counterOptions,
                            (hitInfo: CounterSettings) =>
                                isSiteStatisticsEnabled(hitInfo)
                                    ? siteStatisticsLayout(
                                          ctx,
                                          counterOptions.id,
                                      )
                                    : noop,
                        ],
                        getCounterSettings,
                    ),
                ),
            );
        }
        return undefined;
    },
);
