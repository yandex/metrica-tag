import { waitForBodyTask } from 'src/utils/dom/waitForBody';
import {
    globalMemoWin,
    equal,
    pipe,
    noop,
    bindArgs,
    call,
} from 'src/utils/function';
import { taskFork } from 'src/utils/async';
import { ternary } from 'src/utils/condition';
import { CounterOptions } from 'src/utils/counterOptions';
import {
    getCounterSettings,
    COUNTER_SETTINGS_SETTINGS_KEY,
} from 'src/utils/counterSettings';
import { ctxPath } from 'src/utils/object';
import { isMobile } from 'src/utils/browser';
import { siteStatisticsLayout } from './layout/siteStatisticsLayout';

export const STATISTICS_MODE_KEY = 'sm';
const SETTING_PATH = `${COUNTER_SETTINGS_SETTINGS_KEY}.${STATISTICS_MODE_KEY}`;

type SiteStatisticsReturn = void | Promise<void> | Promise<() => void>;

/**
 * Show Metrica web interface in iframe over site layout
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 */
export const useSiteStatisticsProvider = globalMemoWin<SiteStatisticsReturn>(
    'siteStatistics',
    (
        ctx: Window,
        counterOptions: CounterOptions,
    ): void | Promise<() => void> => {
        if (isMobile(ctx)) {
            return undefined;
        }

        return waitForBodyTask(ctx)(
            taskFork(
                noop,
                bindArgs(
                    [
                        counterOptions,
                        pipe(
                            ctxPath(SETTING_PATH),
                            equal(1),
                            bindArgs(
                                [
                                    bindArgs(
                                        [ctx, counterOptions.id],
                                        siteStatisticsLayout,
                                    ),
                                    noop,
                                ],
                                ternary,
                            ),
                            call,
                        ),
                    ],
                    getCounterSettings,
                ),
            ),
        );
    },
);
