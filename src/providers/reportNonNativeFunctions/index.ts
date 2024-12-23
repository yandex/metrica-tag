import { ctxErrorLogger } from 'src/utils/errorLogger/errorLogger';
import { memo } from 'src/utils/function/memo';
import { secondArg } from 'src/utils/function/identity';
import { DebugConsole } from 'src/providers/debugConsole/debugConsole';
import { debugEnabled } from 'src/providers/debugConsole/debugEnabled';
import { dataLayerObserver } from 'src/utils/dataLayerObserver/dataLayerObserver';
import { nonNativeFunctionsList } from './report';
import { NON_NATIVE_FUNCTION_WARNING_CONSOLE_MESSAGE } from '../consoleRenderer/dictionary';

// eslint-disable-next-line no-useless-escape
const regexTrash = /[\*\.\?\(\)]/g;
const logNonNativeFunction = memo(
    (ctx: Window, fn: any, functionName: string) => {
        try {
            const prettyName = functionName
                .replace('\\s', ' ')
                .replace(regexTrash, '');
            DebugConsole(ctx, '').warn(
                NON_NATIVE_FUNCTION_WARNING_CONSOLE_MESSAGE,
                { ['name']: prettyName },
            );
        } catch (e) {
            // do nothing
        }
    },
    secondArg,
);

/**
 * Detects and logs monkey patching that can cause Metrica bugs https://en.wikipedia.org/wiki/Monkey_patch
 * This is bad practice but some websites redefines methods
 * @param ctx - Current window
 */
export const useReportNonNativeFunctionProviderRaw = (ctx: Window) => {
    if (debugEnabled(ctx)) {
        dataLayerObserver(ctx, nonNativeFunctionsList, ({ observer }) => {
            observer.on(([functionName, fn]: [string, any]) => {
                logNonNativeFunction(ctx, fn, functionName);
                // защита от утечек памяти
                nonNativeFunctionsList.splice(100);
            });
        });
    }
};

export const useReportNonNativeFunctionProvider = ctxErrorLogger(
    'r.nn',
    useReportNonNativeFunctionProviderRaw,
);
