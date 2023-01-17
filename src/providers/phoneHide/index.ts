import { flags } from '@inject';
import { HIDE_PHONES_FEATURE } from 'generated/features';
import { providersSync } from 'src/providersEntrypoint';
import { usePhoneHideProvider } from './phoneHide';

export const initProvider = () => {
    if (flags[HIDE_PHONES_FEATURE]) {
        providersSync.push(usePhoneHideProvider);
    }
};
