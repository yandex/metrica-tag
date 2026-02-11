import { flags } from '@inject';
import {
    WATCH_URL_PARAM,
    ARTIFICIAL_BR_KEY,
    NOT_BOUNCE_BR_KEY,
    NOT_BOUNCE_CLIENT_TIME_BR_KEY,
} from 'src/api/watch';
import { browserInfo } from 'src/utils/browserInfo/browserInfo';
import { UNSUBSCRIBE_PROPERTY } from 'src/providers';
import {
    counterStateGetter,
    counterStateSetter,
} from 'src/providers/getCounters/getCounters';
import { COUNTER_STATE_NOT_BOUNCE } from 'src/providers/getCounters/const';
import { getSender } from 'src/sender';
import { SenderInfo } from 'src/sender/SenderInfo';
import { counterLocalStorage } from 'src/storage/localStorage/localStorage';
import { CounterOptions, getCounterKey } from 'src/utils/counterOptions';
import { getCounterSettings } from 'src/utils/counterSettings/counterSettings';
import { ctxErrorLogger } from 'src/utils/errorLogger/errorLogger';
import { bindArg } from 'src/utils/function/bind';
import { finallyCallUserCallback } from 'src/utils/function/finallyCallUserCallback';
import { getLocation } from 'src/utils/location/location';
import { ctxPath } from 'src/utils/object';
import { getMs, TimeOne } from 'src/utils/time/time';
import { isSameDomainInUrls } from 'src/utils/url';
import { setUserTimeDefer } from 'src/utils/userTimeDefer';
import { parseDecimalInt } from 'src/utils/number/number';
import { pipe } from 'src/utils/function/pipe';
import { CallWithoutArguments, call } from 'src/utils/function/utils';
import { noop } from 'src/utils/function/noop';
import { getArtificialState } from '../artificialHit/artificialHit';
import {
    AccurateTrackBounceHandler,
    APPROXIMATE_VISIT_DURATION,
    DEFAULT_NOT_BOUNCE_TIMEOUT,
    LAST_NOT_BOUNCE_LS_KEY,
    NotBounceHandler,
    METHOD_NAME_ACCURATE_TRACK_BOUNCE,
    METHOD_NAME_NOT_BOUNCE,
    NOT_BOUNCE_HIT_PROVIDER,
} from './const';
import { DebugConsole } from '../debugConsole/debugConsole';
import { NOT_BOUNCE_NO_CALLBACK_CONSOLE_MESSAGE } from '../consoleRenderer/dictionary';

type ProviderResult = {
    [METHOD_NAME_NOT_BOUNCE]: NotBounceHandler;
    [METHOD_NAME_ACCURATE_TRACK_BOUNCE]?: AccurateTrackBounceHandler;
    [UNSUBSCRIBE_PROPERTY]?: () => void;
};

const useNotBounceProviderRaw = (
    ctx: Window,
    counterOpt: CounterOptions,
): ProviderResult => {
    const sender = getSender(ctx, NOT_BOUNCE_HIT_PROVIDER, counterOpt);
    const counterKey = getCounterKey(counterOpt);
    const counterLS = counterLocalStorage(ctx, counterOpt.id);
    const getTrackBounce = bindArg(
        bindArg(counterKey, counterStateGetter(ctx)),
        pipe(call as CallWithoutArguments, ctxPath(COUNTER_STATE_NOT_BOUNCE)),
    );
    const setTrackBounce: () => void = bindArg(
        { [COUNTER_STATE_NOT_BOUNCE]: true },
        counterStateSetter(ctx, counterKey),
    );
    const timer = TimeOne(ctx);
    const startTime = timer(getMs);
    let notBounceHitSent = false;
    let firstHitClientOffset = 0;
    let destroy: (() => void) | undefined;

    getCounterSettings(counterOpt, (options) => {
        firstHitClientOffset = options.firstHitClientTime - startTime;
    });

    const makeNotBounceHit =
        (force: boolean) =>
        (
            options: { ctx: any; callback: (...args: any) => any } = {
                ['ctx']: {},
                ['callback']: noop,
            },
        ) => {
            if (force || (!notBounceHitSent && !counterLS.isBroken)) {
                notBounceHitSent = true;
                setTrackBounce();

                if (destroy) {
                    destroy();
                }

                const notBounceClientStamp = timer(getMs);
                const previousNotBounceClientStamp =
                    parseDecimalInt(
                        counterLS.getVal(LAST_NOT_BOUNCE_LS_KEY) as string,
                    ) || 0;
                const newVisitStarted =
                    previousNotBounceClientStamp <
                    notBounceClientStamp - APPROXIMATE_VISIT_DURATION;
                const isInControlGroup = Math.random() < 0.1;
                counterLS.setVal(LAST_NOT_BOUNCE_LS_KEY, notBounceClientStamp);

                const brInfo = browserInfo({
                    [NOT_BOUNCE_BR_KEY]: 1,
                    [NOT_BOUNCE_CLIENT_TIME_BR_KEY]: firstHitClientOffset,
                    [ARTIFICIAL_BR_KEY]: 1,
                });
                const artificialState = getArtificialState(counterOpt);

                const senderOpt: SenderInfo = {
                    urlParams: {
                        [WATCH_URL_PARAM]:
                            artificialState.url || getLocation(ctx).href,
                    },
                    brInfo,
                    middlewareInfo: {
                        force,
                    },
                };

                const { warn } = DebugConsole(ctx, getCounterKey(counterOpt));

                if (!options['callback'] && options['ctx']) {
                    warn(NOT_BOUNCE_NO_CALLBACK_CONSOLE_MESSAGE);
                }

                if (
                    force ||
                    newVisitStarted ||
                    isInControlGroup ||
                    !isSameDomainInUrls(
                        ctx.location.href,
                        ctx.document.referrer,
                    )
                ) {
                    const result = sender(senderOpt, counterOpt);
                    return finallyCallUserCallback(
                        ctx,
                        'l.o.l',
                        result,
                        options['callback'],
                        options['ctx'],
                    );
                }
            }

            return null;
        };

    const accurateTrackBounce = (time?: number | boolean) => {
        if (getTrackBounce()) {
            return;
        }

        const notBounceTimeout =
            typeof time === 'number' ? time : DEFAULT_NOT_BOUNCE_TIMEOUT;

        destroy = setUserTimeDefer(
            ctx,
            makeNotBounceHit(false),
            notBounceTimeout,
        );

        setTrackBounce();
    };

    if (counterOpt.accurateTrackBounce) {
        accurateTrackBounce(counterOpt.accurateTrackBounce);
    }

    const providerResult: ProviderResult = {
        [METHOD_NAME_NOT_BOUNCE]: makeNotBounceHit(true),
        [UNSUBSCRIBE_PROPERTY]: destroy!,
    };

    if (flags.ACCURATE_TRACK_BOUNCE_METHOD_FEATURE) {
        providerResult[METHOD_NAME_ACCURATE_TRACK_BOUNCE] = accurateTrackBounce;
    }

    return providerResult;
};

/**
 * Sends a notBounce hit automatically, or provides functions for manually send the hit.
 * notBounce is a technical event indicating that the user spent sufficient amount of time on the page
 * @param ctx - Current window
 * @param counterOpt - Counter options during initialization
 */
const useNotBounceProvider = ctxErrorLogger('nb.p', useNotBounceProviderRaw);

export { useNotBounceProvider, useNotBounceProviderRaw };
