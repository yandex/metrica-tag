import { waitForBodyTask } from 'src/utils/dom/waitForBody';
import { globalMemoWin } from 'src/utils/function/globalMemo';
import { taskFork } from 'src/utils/async/task';
import { ternary } from 'src/utils/condition';
import { CounterOptions } from 'src/utils/counterOptions';
import { getCounterSettings } from 'src/utils/counterSettings/counterSettings';
import { ctxPath } from 'src/utils/object';
import { isMobile } from 'src/utils/browser/browser';
import { COUNTER_SETTINGS_SETTINGS_KEY } from 'src/utils/counterSettings/const';
import { bindArgs } from 'src/utils/function/bind/bind';
import { noop } from 'src/utils/function/noop';
import { pipe } from 'src/utils/function/pipe';
import { equal } from 'src/utils/function/curry';
import { call } from 'src/utils/function/utils';
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
