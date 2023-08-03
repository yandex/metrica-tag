import {
    WATCH_URL_PARAM,
    WATCH_REFERER_PARAM,
    DEFER_KEY,
    PAGE_VIEW_BR_KEY,
} from 'src/api/watch';
import type { CounterOptions } from 'src/utils/counterOptions';
import { getSender } from 'src/sender';
import type { SenderInfo } from 'src/sender/SenderInfo';
import { HIT_PROVIDER } from 'src/providers';
import { ctxErrorLogger, errorLogger } from 'src/utils/errorLogger';
import { setSettings } from 'src/utils/counterSettings';
import type { TransportResponse } from 'src/transport/types';
import { getLocation } from 'src/utils/location';
import { getLoggerFn } from 'src/providers/debugConsole/debugConsole';
import {
    ARTIFICIAL_HIT_FEATURE,
    PARAMS_FEATURE,
    USER_PARAMS_FEATURE,
} from 'generated/features';
import { flags } from '@inject';
import { browserInfo } from 'src/utils/browserInfo';
import { bindArgs } from 'src/utils/function';
import { runAsync } from 'src/utils/async';

/**
 * Automatically send page view event. A basic provider enabled by default and not tied to any feature flag
 * @param ctx - Current window
 * @param counterOpt - Counter options during initialization
 */
export const useRawHitProvider = (ctx: Window, counterOpt: CounterOptions) => {
    const sender = getSender(ctx, HIT_PROVIDER, counterOpt);
    const url = counterOpt.forceUrl || `${getLocation(ctx).href}`;
    const referrer = counterOpt.forceReferrer || ctx.document.referrer;

    const senderOpt: SenderInfo = {
        brInfo: browserInfo({
            [PAGE_VIEW_BR_KEY]: 1,
        }),
        urlParams: {
            [WATCH_URL_PARAM]: url,
            [WATCH_REFERER_PARAM]: referrer,
        },
        middlewareInfo: {},
    };

    if (flags[PARAMS_FEATURE]) {
        senderOpt.middlewareInfo!.params = counterOpt.params;
    }

    if (flags[USER_PARAMS_FEATURE]) {
        senderOpt.middlewareInfo!.userParams = counterOpt.userParams;
    }

    if (
        flags[ARTIFICIAL_HIT_FEATURE] &&
        counterOpt.counterDefer &&
        senderOpt.urlParams
    ) {
        // eslint-disable-next-line dot-notation
        senderOpt.urlParams[DEFER_KEY] = '1';
    }

    return sender(senderOpt, counterOpt)
        .then((hitParams?: TransportResponse) => {
            if (!hitParams) {
                return;
            }

            if (!counterOpt.counterDefer) {
                getLoggerFn(
                    ctx,
                    counterOpt,
                    `PageView. Counter ${counterOpt.id}. URL: ${url}. ` +
                        `Referrer: ${referrer}`,
                    counterOpt.params,
                )();
            }

            runAsync(ctx, bindArgs([ctx, counterOpt, hitParams], setSettings));
        })
        .catch(errorLogger(ctx, 'h.g.s'));
};

export const useHitProvider = ctxErrorLogger('h.p', useRawHitProvider);
