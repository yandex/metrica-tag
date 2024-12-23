import { CounterOptions, getCounterKey } from 'src/utils/counterOptions';
import { isIframe, isTP } from 'src/utils/browser/browser';
import { memo } from 'src/utils/function/memo';
import { constructObject } from 'src/utils/function/construct';
import { call } from 'src/utils/function/utils';
import { cForEach } from 'src/utils/array/map';
import {
    counterIframeConnector,
    INIT_MESSAGE_CHILD,
} from 'src/utils/iframeConnector';
import { setDefer } from 'src/utils/defer/defer';

const WAIT_PARENT_FRAME_INIT_TIMEOUT = 3000;

type WaitParentDuidState = {
    /** Callbacks of delayed hits */
    hitsQueue?: (() => void)[] | null;
    /** Is initialized event listener and timer */
    isInited?: boolean;
};

const getParentDuidState = memo(
    constructObject as (opt: CounterOptions) => WaitParentDuidState,
    getCounterKey,
);

/**
 * Pauses hit sending until parent frame inited or timer fired.
 * Activates only if tracker protection enabled and its an iframe.
 * Used for substitution of domain-wide user id (duid) by parent duid.
 * @param ctx - Current window
 * @param opt - Counter options on initialization
 * @param next - Middleware callback
 */
export const waitParentDuid = (
    ctx: Window,
    opt: CounterOptions,
    next: () => void,
) => {
    if (!isTP(ctx) || !isIframe(ctx)) {
        next();
        return;
    }

    const state = getParentDuidState(opt);

    if (!state.isInited) {
        state.isInited = true;
        const iframeConnector = counterIframeConnector(ctx, opt);

        if (!iframeConnector) {
            next();
            return;
        }

        state.hitsQueue = [];

        const purge = () => {
            if (state.hitsQueue) {
                cForEach(call, state.hitsQueue);
                state.hitsQueue = null;
            }
        };

        setDefer(ctx, purge, WAIT_PARENT_FRAME_INIT_TIMEOUT);
        iframeConnector.emitter.on([INIT_MESSAGE_CHILD], purge);
    }

    if (!state.hitsQueue) {
        next();
        return;
    }

    state.hitsQueue.push(next);
};
