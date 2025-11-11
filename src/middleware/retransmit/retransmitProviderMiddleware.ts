import { browserInfo } from 'src/utils/browserInfo/browserInfo';
import { RETRANSMIT_BRINFO_KEY } from 'src/api/common';
import { SenderInfo } from 'src/sender/SenderInfo';
import { CounterOptions } from 'src/utils/counterOptions/types';
import { MiddlewareGetter } from '../types';
import { getRetransmitState } from './state';
import { unRegisterRequest } from './retransmit';

/**
 * Updates retry index for the request being retransmitted.
 * Deletes the request from local storage if sent successfully.
 * @param ctx - Current window
 */
export const retransmitProviderMiddleware: MiddlewareGetter = (
    ctx: Window,
    opt: CounterOptions,
) => {
    const retransmitState = getRetransmitState(ctx);
    return {
        beforeRequest: (senderParams: SenderInfo, next) => {
            const { brInfo = browserInfo(), middlewareInfo } = senderParams;
            const { retransmitIndex } = middlewareInfo!;

            const prevRetry = brInfo.getVal(RETRANSMIT_BRINFO_KEY, 0);
            const currentRetry = prevRetry + 1;
            brInfo.setVal(RETRANSMIT_BRINFO_KEY, currentRetry);
            if (retransmitIndex) {
                retransmitState.updateRetry(retransmitIndex, currentRetry);
            }

            next();
        },

        afterRequest: (senderParams: SenderInfo, next) => {
            unRegisterRequest(ctx, senderParams, opt, retransmitState);
            next();
        },
    };
};
