import { flags } from '@inject';
import { STACK_PROXY_FEATURE } from 'generated/features';
import {
    providersSync,
    windowProviderInitializers,
} from 'src/providersEntrypoint';
import { stackProxy, checkStack } from './stackProxy';

export const initProvider = () => {
    if (flags[STACK_PROXY_FEATURE]) {
        providersSync.push(checkStack);
        windowProviderInitializers.push(stackProxy);
    }
};
