import { memo, noop, bind } from 'src/utils/function';
import { isNativeFn } from 'src/utils/function/isNativeFunction/isNativeFn';
import { getPath } from 'src/utils/object';

export type LogFn = (...data: any[]) => void;
export const createConsole = (ctx: Window) => {
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

    return {
        log,
        error,
        warn,
    };
};

export const getConsole = memo(createConsole);
