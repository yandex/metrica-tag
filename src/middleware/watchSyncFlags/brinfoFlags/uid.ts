import { getUid } from 'src/utils/uid';
import { memo } from 'src/utils/function';
import { CounterOptions } from 'src/utils/counterOptions';
import { isIframe, isTP } from 'src/utils/browser';
import {
    counterIframeConnector,
    IFRAME_MESSAGE_DUID,
} from 'src/utils/iframeConnector';

/**
 * For TP browsers in iframe context try to
 * use iframeConnector parent domain id,
 * that is written in counterFirstHit/waitParentDuid middleware.
 */
export const getSelfOrParentUid = (ctx: Window, opt: CounterOptions) => {
    if (!isTP(ctx) || !isIframe(ctx)) {
        return getUid(ctx, opt);
    }

    const iframeConnector = counterIframeConnector(ctx, opt);
    if (!iframeConnector || !iframeConnector.parents[opt.id]) {
        return getUid(ctx, opt);
    }

    return (
        iframeConnector.parents[opt.id].info[IFRAME_MESSAGE_DUID] ||
        getUid(ctx, opt)
    );
};

export const getUidFlag = memo(
    getSelfOrParentUid,
    (ctx: Window, opt: CounterOptions) => `${opt.ldc}${opt.noCookie}`,
);
