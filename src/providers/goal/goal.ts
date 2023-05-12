import {
    WATCH_URL_PARAM,
    WATCH_REFERER_PARAM,
    ARTIFICIAL_BR_KEY,
} from 'src/api/watch';
import { CounterOptions, getCounterKey } from 'src/utils/counterOptions';
import { ctxErrorLogger } from 'src/utils/errorLogger';
import { getSender } from 'src/sender';
import { noop, bindThisForMethodTest } from 'src/utils/function';
import { finallyCallUserCallback } from 'src/utils/function/finallyCallUserCallback';
import { browserInfo } from 'src/utils/browserInfo';
import { getLocation, Props } from 'src/utils/location';
import { parseUrl } from 'src/utils/url';
import { getLoggerFn } from 'src/providers/debugConsole/debugConsole';
import { isFunction } from 'src/utils/object';
import { flags } from '@inject';
import { DEBUG_EVENTS_FEATURE } from 'generated/features';
import { getArtificialState } from '../artificialHit/artificialHit';
import {
    GOAL_PROVIDER,
    GoalHandler,
    DEFAULT_SCHEME_PREFIX,
    METHOD_NAME_GOAL,
} from './const';

import { dispatchDebuggerEvent } from '../debugEvents';

const getGoalLocation = (
    ctx: Window,
    counterOptions: CounterOptions,
    target: string,
    schemePrefix: string,
): [string, string] => {
    let { hostname, href }: Partial<Props> = getLocation(ctx);
    const { url } = getArtificialState(counterOptions);
    if (url) {
        ({ hostname, href } = parseUrl(ctx, url));
    }
    return [`${schemePrefix}://${hostname}/${target}`, href || ''];
};

const VALIDATE_MAP: Record<string, Function> = {
    goal: bindThisForMethodTest(/[/&=?#]/),
};

/**
 * Transmits information about a completed goal (conversion)
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 * @param schemePrefix - Goal type
 * @param callback - The function that will be called after sending the goal
 */
export const useGoal = ctxErrorLogger(
    'go.in',
    (
        ctx: Window,
        counterOptions: CounterOptions,
        schemePrefix = DEFAULT_SCHEME_PREFIX,
        callback?: () => void,
    ): { [METHOD_NAME_GOAL]: GoalHandler } => {
        return {
            [METHOD_NAME_GOAL]: (
                goalName,
                rawParams?,
                rawUserCallback?,
                rawFnCtx?,
            ) => {
                if (
                    !goalName ||
                    (VALIDATE_MAP[schemePrefix] &&
                        VALIDATE_MAP[schemePrefix](goalName))
                ) {
                    return null;
                }
                let params: Record<string, any> | undefined = rawParams;
                let fnCtx = rawFnCtx;
                let userCallback = rawUserCallback || noop;
                if (isFunction(rawParams)) {
                    userCallback = rawParams as () => any;
                    params = undefined;
                    fnCtx = rawUserCallback;
                }

                const logGoals = getLoggerFn(
                    ctx,
                    counterOptions,
                    `Reach goal. Counter: ${counterOptions.id}. Goal id: ${goalName}`,
                    params,
                );
                // предполагается что в случае схемы, отличной от goal, вызывающий код сам напишет лог
                const shouldLog = schemePrefix === DEFAULT_SCHEME_PREFIX;
                const sender = getSender(ctx, GOAL_PROVIDER, counterOptions);
                const [url, ref] = getGoalLocation(
                    ctx,
                    counterOptions,
                    goalName,
                    schemePrefix,
                );

                const result = sender(
                    {
                        middlewareInfo: {
                            params,
                        },
                        brInfo: browserInfo({
                            [ARTIFICIAL_BR_KEY]: 1,
                        }),
                        urlParams: {
                            [WATCH_URL_PARAM]: url,
                            [WATCH_REFERER_PARAM]: ref,
                        },
                    },
                    counterOptions,
                ).then(() => {
                    if (shouldLog) {
                        logGoals();
                    }
                    if (flags[DEBUG_EVENTS_FEATURE]) {
                        dispatchDebuggerEvent(ctx, {
                            counterKey: getCounterKey(counterOptions),
                            name: 'event',
                            data: {
                                schema: schemePrefix,
                                name: goalName,
                            },
                        });
                    }
                    if (callback) {
                        callback();
                    }
                });
                return finallyCallUserCallback(
                    ctx,
                    'g.s',
                    result,
                    userCallback,
                    fnCtx,
                );
            },
        };
    },
);
