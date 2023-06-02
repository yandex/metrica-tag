import { flags } from '@inject';
import { PARAMS_FEATURE, RETRANSMIT_FEATURE } from 'generated/features';
import { addCommonMiddleware, addMiddlewareForProvider } from 'src/middleware';
import {
    retransmit,
    retransmitProviderMiddleware,
} from 'src/middleware/retransmit';
import { providersAsync } from 'src/providersEntrypoint';
import { PARAMS_PROVIDER } from 'src/providers/params/const';
import { providerMap } from 'src/sender';
import { SENDER_RETRANSMIT } from 'src/sender/const';
import {
    MiddlewareBasedSender,
    useMiddlewareBasedSender,
} from 'src/sender/middleware';
import { nameMap, withoutBeacon } from 'src/transport';
import { ctxErrorLogger } from 'src/utils/errorLogger';
import { RETRANSMIT_PROVIDER } from './const';
import { useRetransmitProvider } from './retransmit';

declare module 'src/providers/index' {
    interface PROVIDERS {
        /** Retransmit saved requests */
        RETRANSMIT_PROVIDER: typeof RETRANSMIT_PROVIDER;
    }
}
declare module 'src/sender/types' {
    interface NameMap {
        /** Retransmit saved requests */
        [RETRANSMIT_PROVIDER]: MiddlewareBasedSender;
    }

    interface Senders {
        SENDER_RETRANSMIT: typeof SENDER_RETRANSMIT;
    }
}

export const initProvider = () => {
    if (flags[RETRANSMIT_FEATURE]) {
        /**
         * NOTE: Retransmit provider does not need any sender middlewares
         * since all initial data is set with the initial sender that created the request.
         */
        providerMap[RETRANSMIT_PROVIDER] =
            useMiddlewareBasedSender(RETRANSMIT_PROVIDER);
        nameMap[RETRANSMIT_PROVIDER] = withoutBeacon;

        providersAsync.push(ctxErrorLogger('p.r', useRetransmitProvider));
        addMiddlewareForProvider(
            RETRANSMIT_PROVIDER,
            retransmitProviderMiddleware,
            1,
        );

        /**
         * Since the length of common middlewares is not known beforehand,
         * enforce artificially high index
         * in order to keep the middleware at the end of the chain.
         */
        addCommonMiddleware(retransmit, 100);

        if (flags[PARAMS_FEATURE]) {
            addMiddlewareForProvider(PARAMS_PROVIDER, retransmit, 100);
        }
    }
};
