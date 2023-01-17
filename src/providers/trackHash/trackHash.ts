import {
    WATCH_URL_PARAM,
    WATCH_REFERER_PARAM,
    TRACK_HASH_BR_KEY,
    AD_BR_KEY,
    PAGE_VIEW_BR_KEY,
    NOINDEX_BR_KEY,
} from 'src/api/watch';
import { ctxErrorLogger, errorLogger } from 'src/utils/errorLogger';
import { CounterOptions, getCounterKey } from 'src/utils/counterOptions';
import { has } from 'src/utils/object';
import { getLocation } from 'src/utils/location';
import { cEvent } from 'src/utils/events';
import { browserInfo } from 'src/utils/browserInfo';
import { getSender } from 'src/sender';
import { GetSenderType } from 'src/sender/types';
import { bind, noop } from 'src/utils/function';
import { SenderInfo } from 'src/sender/SenderInfo';
import { yaDirectExists } from 'src/utils/direct';
import { UNSUBSCRIBE_PROPERTY } from 'src/providers';
import { getGlobalStorage } from 'src/storage/global';
import { LAST_REFERRER_KEY } from 'src/storage/global/consts';
import { setDeferInterval, clearDeferInterval } from 'src/utils/defer';
import { counterStateSetter } from 'src/providers/getCounters/getCounters';
import { COUNTER_STATE_TRACK_HASH } from 'src/providers/getCounters/const';
import { METHOD_TRACK_HASH, TRACK_HASH_PROVIDER } from './const';

export const HASH_CHECKS_INTERVAL = 200;
let timerOnHashChange: number;

function getHashValue(ctx: Window) {
    const hashValue = getLocation(ctx).hash.split('#')[1];

    return hashValue ? hashValue.split('?')[0] : '';
}

function onOldBrowserHashChange(ctx: Window, handler: Function) {
    let lastHash = getHashValue(ctx);

    function watchHash() {
        const hash = getHashValue(ctx);

        if (hash !== lastHash) {
            handler();
            lastHash = hash;
        }
    }

    timerOnHashChange = setDeferInterval(
        ctx,
        watchHash,
        HASH_CHECKS_INTERVAL,
        't.h',
    );

    return bind(clearDeferInterval, null, ctx, timerOnHashChange);
}

function onHashChange(
    ctx: Window,
    counterOptions: CounterOptions,
    sender: GetSenderType<typeof TRACK_HASH_PROVIDER>,
) {
    const { counterType, ut, forceUrl } = counterOptions;
    const globalConfig = getGlobalStorage(ctx);
    const brInfo = browserInfo({
        [TRACK_HASH_BR_KEY]: 1,
        [PAGE_VIEW_BR_KEY]: 1,
    });

    if (yaDirectExists(ctx, counterType)) {
        brInfo.setVal(AD_BR_KEY, '1');
    }

    if (ut) {
        brInfo.setVal(NOINDEX_BR_KEY, '1');
    }

    const lastReferrer = globalConfig.getVal<string>(LAST_REFERRER_KEY);
    const { href } = getLocation(ctx);

    const senderOpt: SenderInfo = {
        urlParams: {
            [WATCH_URL_PARAM]: forceUrl || href,
            [WATCH_REFERER_PARAM]: lastReferrer,
        },
        brInfo,
    };

    sender(senderOpt, counterOptions).catch(errorLogger(ctx, 'g.s'));

    globalConfig.setVal(LAST_REFERRER_KEY, href);
}

/**
 * Tracks URL hash change
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 */
export const useTrackHash = ctxErrorLogger(
    'th.e',
    (ctx: Window, counterOptions: CounterOptions) => {
        const sender = getSender(ctx, TRACK_HASH_PROVIDER, counterOptions);
        const setCounterState = counterStateSetter(
            ctx,
            getCounterKey(counterOptions),
        );
        let enabled = false;

        const handleHashChange = errorLogger(
            ctx,
            'h.h.ch',
            bind(onHashChange, null, ctx, counterOptions, sender),
        );

        let unsetTrackHash = noop;
        function setTrackHash() {
            if (!enabled) {
                if (has(ctx, 'onhashchange')) {
                    unsetTrackHash = cEvent(ctx).on(
                        ctx,
                        ['hashchange'],
                        handleHashChange,
                    );
                } else {
                    unsetTrackHash = onOldBrowserHashChange(
                        ctx,
                        handleHashChange,
                    );
                }
            }
        }

        const toggleTrackHash = (enable?: boolean) => {
            if (enable) {
                setTrackHash();
            } else {
                unsetTrackHash();
            }
            enabled = Boolean(enable);
            setCounterState({
                [COUNTER_STATE_TRACK_HASH]: enabled,
            });
        };

        if (counterOptions.trackHash) {
            setTrackHash();
            enabled = true;
        }

        const trackHandler = errorLogger(ctx, 'tr.hs.h', toggleTrackHash);

        return {
            [METHOD_TRACK_HASH]: trackHandler,
            [UNSUBSCRIBE_PROPERTY]: unsetTrackHash,
        };
    },
);
