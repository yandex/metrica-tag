import { flags } from '@inject';
import { DEBUG_CONSOLE_FEATURE } from 'generated/features';
import { windowProviderInitializers } from 'src/providersEntrypoint';
import { COOKIES_WHITELIST } from 'src/storage/cookie/isAllowed';
import { useReportNonNativeFunctionProvider } from '../reportNonNativeFunctions';
import { DEBUG_CTX_FLAG, DEBUG_STORAGE_FLAG } from './const';

declare global {
    interface Window {
        [DEBUG_CTX_FLAG]: boolean;
    }
}

export const initProvider = () => {
    if (flags[DEBUG_CONSOLE_FEATURE]) {
        COOKIES_WHITELIST.push(DEBUG_STORAGE_FLAG);
        windowProviderInitializers.unshift(useReportNonNativeFunctionProvider);
    }
};
