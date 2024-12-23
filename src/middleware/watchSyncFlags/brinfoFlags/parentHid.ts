import { isIframe } from 'src/utils/browser/browser';
import {
    counterIframeConnector,
    IFRAME_MESSAGE_HID,
} from 'src/utils/iframeConnector';
import { cKeys } from 'src/utils/object';
import { CounterOptions } from 'src/utils/counterOptions';
import { FlagGetter } from 'src/middleware/watchSyncFlags/const';

// Uses iframeConnector parent hid, that is written in counterFirstHit/waitParentDuid middleware
export const getParentHid: FlagGetter = (ctx: Window, opt: CounterOptions) => {
    if (!isIframe(ctx)) {
        return null;
    }

    const iframeConnector = counterIframeConnector(ctx, opt);

    if (!iframeConnector) {
        return null;
    }

    const keys = cKeys(iframeConnector.parents);

    if (!keys.length) {
        return null;
    }

    return iframeConnector.parents[keys[0]].info[IFRAME_MESSAGE_HID]!;
};
