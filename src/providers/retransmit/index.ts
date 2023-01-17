import { RETRANSMIT_FEATURE } from 'generated/features';
import { flags } from '@inject';
import { providersAsync } from 'src/providersEntrypoint';
import { useRetransmitProvider } from './retransmit';

export const initProvider = () => {
    if (flags[RETRANSMIT_FEATURE]) {
        providersAsync.push(useRetransmitProvider);
    }
};
