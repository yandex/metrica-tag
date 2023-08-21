import { flags } from '@inject';
import { DEBUG_CONSOLE_FEATURE } from 'generated/features';
import {
    prioritizedProviders,
    windowProviderInitializers,
} from 'src/providersEntrypoint';
import { useReportNonNativeFunctionProvider } from '../reportNonNativeFunctions';
import { DEBUG_CTX_FLAG } from './const';
import { useDebugConsoleProvider } from './debugConsole';

declare global {
    interface Window {
        [DEBUG_CTX_FLAG]: boolean;
    }
}

export const initProvider = () => {
    prioritizedProviders.push(useDebugConsoleProvider);
    if (flags[DEBUG_CONSOLE_FEATURE]) {
        windowProviderInitializers.unshift(useReportNonNativeFunctionProvider);
    }
};
