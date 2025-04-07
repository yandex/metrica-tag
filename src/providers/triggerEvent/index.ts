import { flags } from '@inject';
import { providersSync } from 'src/providersEntrypoint';
import { useTriggerEvent } from './triggerEvent';

export const initProvider = () => {
    if (flags.TRIGGER_EVENT_FEATURE) {
        providersSync.push(useTriggerEvent);
    }
};
