import { getRetransmitState } from 'src/middleware/retransmit/state';
import type { CounterOptions } from 'src/utils/counterOptions';
import { sendRetransmitRequests } from './sendRetransmitRequests';

/**
 * Looks for saved requests in local storage and tries to retransmit them
 * @param ctx - Current window
 * @param counterOpt - Counter options during initialization
 */
export const useRetransmitProvider = (
    ctx: Window,
    counterOpt: CounterOptions,
) => {
    const retransmitState = getRetransmitState(ctx);
    retransmitState.clearExpired();
    return sendRetransmitRequests(
        ctx,
        counterOpt,
        retransmitState.getNotExpired(),
    );
};
