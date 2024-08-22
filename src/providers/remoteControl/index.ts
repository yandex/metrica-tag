import { flags } from '@inject';
import { REMOTE_CONTROL_FEATURE } from 'generated/features';
import { windowProviderInitializers } from 'src/providersEntrypoint';
import { remoteControl } from './remoteControl';

declare global {
    interface HTMLElement {
        // Cached xpath for remote control
        _ymp?: string;
    }
}

export const initProvider = () => {
    if (flags[REMOTE_CONTROL_FEATURE]) {
        windowProviderInitializers.push(remoteControl);
    }
};
