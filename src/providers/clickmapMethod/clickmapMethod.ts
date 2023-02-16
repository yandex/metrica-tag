import { ctxErrorLogger } from 'src/utils/errorLogger';
import { bindArg } from 'src/utils/function';
import { counterStateSetter } from 'src/providers/getCounters/getCounters';
import { CounterOptions, getCounterKey } from 'src/utils/counterOptions';
import { COUNTER_STATE_CLICKMAP } from 'src/providers/getCounters/const';
import { isUndefined } from 'src/utils/object';
import { TClickMapParams } from '../clickmap/const';
import { METHOD_NAME_CLICK_MAP } from './const';

export const trackClicks = (
    setVal: ReturnType<typeof counterStateSetter>,
    rawParams?: TClickMapParams,
) => {
    setVal({
        [COUNTER_STATE_CLICKMAP]: isUndefined(rawParams) ? true : rawParams,
    });
};

/**
 * Provider for calling heat map of clicks as a function
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 */
export const useClickmapMethodProvider = ctxErrorLogger(
    'c.m.p',
    (ctx: Window, counterOptions: CounterOptions) => {
        const counterKey = getCounterKey(counterOptions);
        return {
            [METHOD_NAME_CLICK_MAP]: bindArg(
                counterStateSetter(ctx, counterKey),
                trackClicks,
            ),
        };
    },
);
