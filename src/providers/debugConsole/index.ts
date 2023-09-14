import { flags } from '@inject';
import {
    DEBUG_CONSOLE_FEATURE,
    DEBUG_EVENTS_FEATURE,
} from 'generated/features';
import {
    prioritizedProviders,
    windowProviderInitializers,
} from 'src/providersEntrypoint';
import { COOKIES_WHITELIST } from 'src/storage/cookie/isAllowed';
import { useReportNonNativeFunctionProvider } from '../reportNonNativeFunctions';
import { DEBUG_COOKIE, DEBUG_CTX_FLAG } from './const';
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

    if (flags[DEBUG_CONSOLE_FEATURE] || flags[DEBUG_EVENTS_FEATURE]) {
        COOKIES_WHITELIST.push(DEBUG_COOKIE);
    }
};
