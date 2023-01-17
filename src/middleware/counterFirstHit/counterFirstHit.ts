import { PAGE_VIEW_BR_KEY, ARTIFICIAL_BR_KEY } from 'src/api/watch';
import type { MiddlewareGetter } from 'src/middleware/types';
import type { SenderInfo } from 'src/sender/SenderInfo';
import { CounterOptions, getCounterKey } from 'src/utils/counterOptions';
import type { BrowserInfo } from 'src/utils/browserInfo';
import { memo, call, bindArgs } from 'src/utils/function';
import { cForEach } from 'src/utils/array';
import { waitParentDuid } from 'src/middleware/counterFirstHit/waitParentDuid';

type FirstHitState = {
    /** Request flags of first hit */
    firstHitBrinfo: BrowserInfo | null;
    /** Callbacks of delayed hits */
    hitsQueue: (() => void)[] | null;
};

const getFirstHitState = memo(
    (opt: CounterOptions) =>
        ({
            firstHitBrinfo: null,
            hitsQueue: [],
        } as FirstHitState),
    getCounterKey,
);

const checkFirstHitResolve = (
    ctx: Window,
    brInfo: BrowserInfo,
    cState: FirstHitState,
) => {
    const state = cState;
    const { hitsQueue, firstHitBrinfo } = state;
    const isFirstHit = firstHitBrinfo === brInfo;
    if (isFirstHit && hitsQueue) {
        cForEach(call, hitsQueue);
        state.hitsQueue = null;
    }
};

export const isFirstHit = (senderParams: SenderInfo) => {
    const { brInfo } = senderParams;
    return (
        brInfo &&
        brInfo.getVal(PAGE_VIEW_BR_KEY) &&
        !brInfo.getVal(ARTIFICIAL_BR_KEY)
    );
};

const waitFirstHitResolve = (
    senderParams: SenderInfo,
    state: FirstHitState,
    resolver: () => void,
) => {
    const { brInfo } = senderParams;
    if (!brInfo) {
        resolver();
        return;
    }
    // Resolve immediately for hits who receive counter options
    // This is our first hit
    if (isFirstHit(senderParams)) {
        state.firstHitBrinfo = brInfo;
        resolver();
        return;
    }
    if (!state.hitsQueue) {
        resolver();
        return;
    }
    state.hitsQueue.push(resolver);
};

/**
 * Sends first hit and delays other hits
 * @param ctx - Current window
 * @param opt - Counter options on initialization
 */
export const counterFirstHit: MiddlewareGetter = (
    ctx: Window,
    opt: CounterOptions,
) => ({
    beforeRequest: (senderParams: SenderInfo, next) => {
        const state = getFirstHitState(opt);
        const parentCallback = bindArgs(
            [senderParams, state, next],
            waitFirstHitResolve,
        );
        waitParentDuid(ctx, opt, parentCallback);
    },
    afterRequest: (senderParams: SenderInfo, next) => {
        const { brInfo } = senderParams;
        const state = getFirstHitState(opt);
        if (brInfo) {
            checkFirstHitResolve(ctx, brInfo, state);
        }
        next();
    },
});
