import { ctxErrorLogger } from 'src/utils/errorLogger';
import { memo, secondArg } from 'src/utils/function';
import {
    DebugConsole,
    debugEnabled,
} from 'src/providers/debugConsole/debugConsole';
import { dataLayerObserver } from 'src/utils/dataLayerObserver';
import { nonNativeFunctionsList } from './report';

// eslint-disable-next-line no-useless-escape
const regexTrash = /[\*\.\?\(\)]/g;
const logNonNativeFunction = memo(
    (ctx: Window, fn: any, functionName: string) => {
        try {
            const prettyName = functionName
                .replace('\\s', ' ')
                .replace(regexTrash, '');
            DebugConsole(ctx, '').warn(
                `Function "${prettyName}" has been overridden, this may cause issues with Metrika counter`,
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
    if (debugEnabled(ctx).isEnabled) {
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
