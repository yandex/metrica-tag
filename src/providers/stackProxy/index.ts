import { flags } from '@inject';
import { STACK_PROXY_FEATURE } from 'generated/features';
import { providersSync } from 'src/providersEntrypoint';
import { checkStack } from './stackProxy';

export const initProvider = () => {
    if (flags[STACK_PROXY_FEATURE]) {
        providersSync.push(checkStack);
    }
};
