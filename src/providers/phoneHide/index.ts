import { flags } from '@inject';
import { HIDE_PHONES_FEATURE } from 'generated/features';
import { providersSync } from 'src/providersEntrypoint';
import { COUNTER_SETTINGS_HIDE_PHONES_KEY } from './const';
import { usePhoneHideProvider } from './phoneHide';

declare module 'src/utils/counterSettings/types' {
    interface CounterSettingsParams {
        /** An array of phones to hide */
        [COUNTER_SETTINGS_HIDE_PHONES_KEY]?: string[];
    }
}

export const initProvider = () => {
    if (flags[HIDE_PHONES_FEATURE]) {
        providersSync.push(usePhoneHideProvider);
    }
};
