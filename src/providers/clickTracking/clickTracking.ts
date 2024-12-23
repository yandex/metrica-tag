import { ctxErrorLogger, errorLogger } from 'src/utils/errorLogger/errorLogger';
import { cEvent } from 'src/utils/events/events';
import { bindArgs } from 'src/utils/function/bind';
import { pipe } from 'src/utils/function/pipe';
import { getPath, isNil } from 'src/utils/object';
import { CounterOptions } from 'src/utils/counterOptions';
import { destructingDecorator } from 'src/utils/methodDecorators/destructing';
import { getCounterSettings } from 'src/utils/counterSettings/counterSettings';
import { getLoggerFn } from 'src/providers/debugConsole/debugConsole';
import { useGoal } from 'src/providers/goal/goal';
import { stringify } from 'src/utils/querystring';
import { closestButton, getButtonData } from 'src/utils/dom/button';
import { toZeroOrOne } from 'src/utils/boolean';
import { CounterSettings } from 'src/utils/counterSettings/types';
import { METHOD_NAME_GOAL } from '../goal/const';
import { INTERNAL_PARAMS_KEY, IS_TRUSTED_EVENT_KEY } from '../params/const';
import {
    BUTTON_GOAL_CONSOLE_MESSAGE,
    BUTTON_GOAL_INIT_CONSOLE_MESSAGE,
} from '../consoleRenderer/dictionary';

export const GOAL_PREFIX = 'btn';

export const handleClick = (
    ctx: Window,
    counterOptions: CounterOptions,
    event: MouseEvent,
) => {
    const target = getPath(event, 'target') as HTMLElement | null;
    if (!target) {
        return;
    }

    const button = closestButton(ctx, target);
    const data = getButtonData(ctx, button);

    if (!data) {
        return;
    }

    const query = `?${stringify(data)}`;

    const logGoals = getLoggerFn(
        ctx,
        counterOptions,
        BUTTON_GOAL_CONSOLE_MESSAGE,
        {
            ['id']: counterOptions.id,
            ['query']: query,
        },
    );

    const isTrustedEvent = getPath(event, 'isTrusted');

    let rawParams;
    if (isNil(isTrustedEvent)) {
        rawParams = undefined;
    } else {
        rawParams = {
            [INTERNAL_PARAMS_KEY]: {
                [IS_TRUSTED_EVENT_KEY]: toZeroOrOne(isTrustedEvent),
            },
        };
    }

    useGoal(ctx, counterOptions, GOAL_PREFIX, logGoals)[METHOD_NAME_GOAL](
        query,
        rawParams,
    );
};

/**
 * Provider for tracking button clicks
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 */
export const useClickTracking = ctxErrorLogger(
    's.f.i',
    (ctx: Window, counterOptions: CounterOptions) =>
        getCounterSettings(
            counterOptions,
            (counterSettings: CounterSettings) => {
                if (!getPath(counterSettings, 'settings.button_goals')) {
                    return undefined;
                }

                const unsubscribe = cEvent(ctx).on(
                    ctx,
                    ['click'],
                    errorLogger(
                        ctx,
                        'c.t.c',
                        pipe(
                            bindArgs(
                                [ctx, counterOptions],
                                destructingDecorator(
                                    ctx,
                                    counterOptions,
                                    '',
                                    handleClick,
                                ),
                            ),
                        ),
                    ),
                );

                getLoggerFn(
                    ctx,
                    counterOptions,
                    BUTTON_GOAL_INIT_CONSOLE_MESSAGE,
                    {
                        ['id']: counterOptions.id,
                    },
                )();

                return unsubscribe;
            },
        ),
);
