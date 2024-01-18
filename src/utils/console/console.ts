import { DEBUG_EVENTS_FEATURE } from 'generated/features';
import { flags } from '@inject';
import { wrapLogFunction } from 'src/providers/debugEvents/wrapLoggerFunction';
import { memo, noop, bind, secondArg } from 'src/utils/function';
import { isNativeFn } from 'src/utils/function/isNativeFunction/isNativeFn';
import { getPath } from 'src/utils/object';

type LogFn = (...data: any[]) => void;
export const createConsole = (ctx: Window, counterKey: string) => {
    const consoleCtx = getPath(ctx, 'console') as unknown as Console;
    const logFn = getPath(consoleCtx, 'log')!;
    const log: LogFn = isNativeFn('log', logFn)
        ? bind(logFn, consoleCtx)
        : noop;
    const warnFn = getPath(consoleCtx, 'warn')!;
    const warn: LogFn = isNativeFn('warn', warnFn)
        ? bind(warnFn, consoleCtx)
        : log;
    const errorFn = getPath(consoleCtx, 'error')!;
    const error: LogFn = isNativeFn('error', errorFn)
        ? bind(errorFn, consoleCtx)
        : log;
    if (flags[DEBUG_EVENTS_FEATURE]) {
        return {
            log: wrapLogFunction(ctx, 'log', counterKey, log),
            error: wrapLogFunction(ctx, 'error', counterKey, error),
            warn: wrapLogFunction(ctx, 'warn', counterKey, warn),
        };
    }
    return {
        log,
        error,
        warn,
    };
};

export const getConsole = memo(createConsole, secondArg);
