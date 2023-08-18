import { flags } from '@inject';
import { DEBUG_CONSOLE_FEATURE } from 'generated/features';
import {
    prioritizedProviders,
    windowProviderInitializers,
} from 'src/providersEntrypoint';
import { useReportNonNativeFunctionProvider } from '../reportNonNativeFunctions';
import { useDebugConsoleProvider } from './debugConsole';

export const initProvider = () => {
    prioritizedProviders.push(useDebugConsoleProvider);
    if (flags[DEBUG_CONSOLE_FEATURE]) {
        windowProviderInitializers.unshift(useReportNonNativeFunctionProvider);
    }
};
