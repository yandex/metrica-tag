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
import { ctxErrorLogger, errorLogger } from 'src/utils/errorLogger/errorLogger';
import { setSettings } from 'src/utils/counterSettings/counterSettings';
import type { TransportResponse } from 'src/transport/types';
import { getLocation } from 'src/utils/location/location';
import { getLoggerFn } from 'src/providers/debugConsole/debugConsole';
import { flags } from '@inject';
import { browserInfo } from 'src/utils/browserInfo/browserInfo';
import { bindArgs } from 'src/utils/function/bind';
import { runAsync } from 'src/utils/async/async';
import { CounterSettings } from 'src/utils/counterSettings/types';
import { HIT_CONSOLE_MESSAGE } from '../consoleRenderer/dictionary';

/**
 * Automatically send page view event. A basic provider enabled by default and not tied to any feature flag
 * @param ctx - Current window
 * @param counterOpt - Counter options during initialization
 */
export const useRawHitProvider = (ctx: Window, counterOpt: CounterOptions) => {
    // FIXME: wrong sender types involve this casting
    const sender = getSender(ctx, HIT_PROVIDER, counterOpt) as unknown as (
        opt: SenderInfo,
        counterOptions: CounterOptions,
    ) => Promise<TransportResponse>;
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

    if (flags.PARAMS_FEATURE) {
        senderOpt.middlewareInfo!.params = counterOpt.params;
    }

    if (flags.USER_PARAMS_FEATURE) {
        senderOpt.middlewareInfo!.userParams = counterOpt.userParams;
    }

    if (
        flags.ARTIFICIAL_HIT_FEATURE &&
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
                    HIT_CONSOLE_MESSAGE,
                    {
                        ['id']: counterOpt.id,
                        ['url']: url,
                        ['ref']: referrer,
                    },
                    counterOpt.params,
                )();
            }

            runAsync(
                ctx,
                bindArgs(
                    [
                        ctx,
                        counterOpt,
                        // FIXME: wrong TransportResponse type involves this casting
                        hitParams as unknown as CounterSettings,
                    ],
                    setSettings,
                ),
            );
        })
        .catch(errorLogger(ctx, 'h.g.s'));
};

export const useHitProvider = ctxErrorLogger('h.p', useRawHitProvider);
