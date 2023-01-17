import { ctxErrorLogger } from 'src/utils/errorLogger';
import { getConsole } from 'src/utils/console';
import { cForEach, clearArray, cSome } from 'src/utils/array';
import {
    noop,
    memo,
    bindArg,
    call,
    bindArgs,
    secondArg,
} from 'src/utils/function';
import { getLocation } from 'src/utils/location';
import {
    DEBUG_CONSOLE_FEATURE,
    DEBUG_EVENTS_FEATURE,
} from 'generated/features';
import { globalCookieStorage } from 'src/storage/cookie';
import { argsToArray } from 'src/utils/function/args';
import { wrapLogFunction } from 'src/providers/debugEvents/wrapLoggerFunction';
import { flags } from '@inject';

import { CounterOptions, getCounterKey } from 'src/utils/counterOptions';
import { isCounterSilent } from 'src/utils/isCounterSilent';
import { getGlobalStorage } from 'src/storage/global';
import { DEBUG_CTX_FLAG, DEBUG_STORAGE_FLAG, DEBUG_URL_PARAM } from './const';

type ConsoleMethods = 'log' | 'warn' | 'error';
type LogQueue = [method: ConsoleMethods, args: any[]][];

const LOG_QUEUE_PREFIX = 'dclq';
const LOG_ENABLED_PREFIX = 'dce';

const createEmptyConsole = (ctx: Window, counterId: string) =>
    flags[DEBUG_EVENTS_FEATURE]
        ? {
              log: wrapLogFunction(ctx, 'log', counterId, noop),
              warn: wrapLogFunction(ctx, 'log', counterId, noop),
              error: wrapLogFunction(ctx, 'log', counterId, noop),
          }
        : {
              log: noop,
              warn: noop,
              error: noop,
          };

export const isDebugUrlWithValue = (ctx: Window, value: string) =>
    getLocation(ctx).href.indexOf(`${DEBUG_URL_PARAM}=${value}`) > -1;

export const debugEnabled = (ctx: Window) => {
    const cookie = globalCookieStorage(ctx);
    const hasCookieFlag = cookie.getVal(DEBUG_STORAGE_FLAG) === '1';
    const hasUrlFlag = isDebugUrlWithValue(ctx, '1');
    const hasCtxFlag = ctx[DEBUG_CTX_FLAG];
    return {
        hasCookieFlag,
        isDebug: hasCtxFlag || hasUrlFlag,
        isEnabled: cSome(Boolean, [hasCookieFlag, hasCtxFlag, hasUrlFlag]),
    };
};

/**
 * Provider for global queue of actions and function to add them
 * @param ctx - Current window
 * @param counterKey - Caching option, counter id and type combined
 */
const createDebugConsole = ctxErrorLogger(
    'dc.init',
    (ctx, counterKey: string) => {
        const location = getLocation(ctx);
        const realConsole = getConsole(ctx, counterKey);
        getGlobalStorage(ctx).setSafe<LogQueue>(
            `${LOG_QUEUE_PREFIX}:${counterKey}`,
            [],
        );

        const log = (method: ConsoleMethods, ...args: any[]) => {
            const isConsoleEnabled = getGlobalStorage(ctx).getVal<boolean>(
                `${LOG_ENABLED_PREFIX}:${counterKey}`,
                false,
            );
            if (isConsoleEnabled) {
                realConsole[method](...args);
            }
            const logQueue = getGlobalStorage(ctx).getVal<LogQueue>(
                `${LOG_QUEUE_PREFIX}:${counterKey}`,
            );
            logQueue.push([method, args]);
        };

        const cookie = globalCookieStorage(ctx);
        const { isDebug, hasCookieFlag } = debugEnabled(ctx);
        if (isDebug && !hasCookieFlag) {
            cookie.setVal(DEBUG_STORAGE_FLAG, '1', undefined, location.host);
        }
        const canLog = isDebug || hasCookieFlag;

        return canLog
            ? {
                  log: bindArg('log', log),
                  warn: bindArg('warn', log),
                  error: bindArg('error', log),
              }
            : createEmptyConsole(ctx, counterKey);
    },
);

export const DebugConsole = memo(
    flags[DEBUG_CONSOLE_FEATURE] ? createDebugConsole : createEmptyConsole,
    secondArg,
);

export const consoleLog = (flags[DEBUG_CONSOLE_FEATURE]
    ? function consoleLogFn() {
          // eslint-disable-next-line prefer-rest-params
          const [ctx, counterKey, ...arg] = argsToArray(arguments);
          const consoleObj = DebugConsole(ctx, counterKey);
          consoleObj.log.apply(consoleLog, arg);
      }
    : noop) as any as (ctx: Window, counterKey: string, ...s: any[]) => void;

/**
 * Function for getting an event logger of a certain format
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 * @param message - The text that will be output to the console
 * @param params - Visit parameters to be sent with a hit
 */
export const getLoggerFn = (
    ctx: Window,
    counterOptions: CounterOptions,
    message: string,
    params?: Record<string, any> | string,
) =>
    flags[DEBUG_CONSOLE_FEATURE] && !isCounterSilent(counterOptions)
        ? bindArg(
              bindArgs(
                  [
                      ctx,
                      getCounterKey(counterOptions),
                      ...(params ? [`${message}. Params:`, params] : [message]),
                  ],
                  consoleLog,
              ),
              call,
          )
        : noop;

const emptyLogQueue = (ctx: Window, queueId: string) => {
    getGlobalStorage(ctx).setVal<boolean>(
        `${LOG_ENABLED_PREFIX}:${queueId}`,
        true,
    );
    const logQueue = getGlobalStorage(ctx).getVal<LogQueue>(
        `${LOG_QUEUE_PREFIX}:${queueId}`,
    );
    if (logQueue) {
        cForEach(([method, args]) => {
            call(DebugConsole(ctx, queueId)[method], ...args);
        }, logQueue);
        clearArray(logQueue);
    }
};

/**
 * Provider for debugging the events being sent and the actions taking place
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 */
export const useDebugConsoleProvider = ctxErrorLogger(
    'p.dc',
    (ctx: Window, counterOptions: CounterOptions) => {
        const counterKey = getCounterKey(counterOptions);
        // This is queue for native functions warnings and such
        emptyLogQueue(ctx, '');
        emptyLogQueue(ctx, counterKey);
    },
);
