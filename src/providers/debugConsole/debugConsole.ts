import { ctxErrorLogger } from 'src/utils/errorLogger';
import { noop, memo, bindArg, bindArgs, secondArg } from 'src/utils/function';
import {
    DEBUG_CONSOLE_FEATURE,
    DEBUG_EVENTS_FEATURE,
} from 'generated/features';
import { flags } from '@inject';
import { CounterOptions, getCounterKey } from 'src/utils/counterOptions';
import { isCounterKeySilent } from 'src/utils/isCounterSilent';
import { dispatchDebuggerEvent } from 'src/providers/debugEvents';
import { isArray } from 'src/utils/array';

/**
 * @param args console.log function arguments, string arguments could be template ids
 * @param variables variables for present string message templates
 */
type LogFn = (
    args: unknown | unknown[],
    variables?: Record<string, string | number>,
) => void;
export type ConsoleObject = {
    log: LogFn;
    warn: LogFn;
    error: LogFn;
};

export const createDebuggerEventsConsole = (
    ctx: Window,
    counterKey: string,
): ConsoleObject => {
    const log = (
        type: 'log' | 'warn' | 'error',
        args: unknown | unknown[],
        variables?: Record<string, string | number>,
    ) => {
        dispatchDebuggerEvent(ctx, {
            ['name']: 'log',
            ['counterKey']: counterKey,
            ['data']: {
                ['args']: isArray(args) ? args : [args],
                ['type']: type,
                ['variables']: variables,
            },
        });
    };

    return {
        log: bindArg('log', log),
        error: bindArg('error', log),
        warn: bindArg('warn', log),
    };
};

const createEmptyConsole = (): ConsoleObject => ({
    log: noop,
    warn: noop,
    error: noop,
});

/**
 * Provider for global queue of actions and function to add them
 * @param ctx - Current window
 * @param counterKey - Caching option, counter id and type combined
 */
const createDebugConsole = ctxErrorLogger(
    'dc.init',
    (ctx, counterKey: string) => {
        if (flags[DEBUG_EVENTS_FEATURE] && flags[DEBUG_CONSOLE_FEATURE]) {
            if (!isCounterKeySilent(counterKey)) {
                return createDebuggerEventsConsole(ctx, counterKey);
            }
        }
        return createEmptyConsole();
    },
);

export const DebugConsole: (ctx: Window, counterKey: string) => ConsoleObject =
    memo(createDebugConsole, secondArg);

/**
 *
 * @param ctx Window
 * @param counterKey
 * @param args console.log function arguments, string arguments could be template ids
 * @param variables variables for present string message templates
 */
export const consoleLog = (
    ctx: Window,
    counterKey: string,
    args: unknown | unknown[],
    variables?: Record<string, string | number>,
) => {
    // eslint-disable-next-line prefer-rest-params
    const consoleObj = DebugConsole(ctx, counterKey);
    consoleObj.log(args, variables);
};

/**
 * Function for getting an event logger of a certain format
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 * @param message - The text that will be output to the console or message template id
 * @param variables variables for present string message templates
 * @param params - Visit parameters to be sent with a hit
 */
export const getLoggerFn = (
    ctx: Window,
    counterOptions: CounterOptions,
    message: string,
    variables?: Record<string, string | number>,
    params?: Record<string, any> | string,
) =>
    bindArgs(
        [
            ctx,
            getCounterKey(counterOptions),
            params ? [`${message}.p`, params] : message,
            variables,
        ],
        consoleLog,
    );
