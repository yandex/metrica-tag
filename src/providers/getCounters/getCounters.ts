import { ctxErrorLogger, errorLogger } from 'src/utils/errorLogger/errorLogger';
import { cKeys, mix } from 'src/utils/object';
import { COUNTERS_GLOBAL_KEY } from 'src/utils/counter/getInstance';
import { getGlobalStorage } from 'src/storage/global/getGlobal';
import { pipe } from 'src/utils/function/pipe';
import { ctxMap } from 'src/utils/array/map';
import { CounterOptions, getCounterKey } from 'src/utils/counterOptions';
import { getVal, setVal, deleteVal } from 'src/storage/closureStorage';
import { curry2 } from 'src/utils/function/curry';
import { bind, bindArgs } from 'src/utils/function/bind/bind';
import {
    GetCountersMethod,
    CounterInfo,
    ExtraCounterInfo,
    RawCounterInfo,
    ExportedCounterInfo,
} from './types';
import {
    COUNTER_STATE_ID,
    COUNTER_STATE_TYPE,
    COUNTER_STATE_CLICKMAP,
    COUNTER_STATE_TRACK_HASH,
} from './const';

export const counterStateSetter =
    (ctx: Window, counterKey: string) => (val: RawCounterInfo) => {
        setVal(ctx, counterKey, val);
    };

export const counterStateGetter = curry2(getVal);

/**
 * Constructs external method for getting flags of all counters on page (accessible as Ya.Metrika.counters())
 * @param ctx - Current window
 */
export const createCountersGetter = ctxErrorLogger(
    'c.c.cc',
    (ctx: Window): GetCountersMethod => {
        const globalConfig = getGlobalStorage(ctx);

        const iterateKeys = pipe(
            counterStateGetter(ctx),
            (counterState: CounterInfo): ExportedCounterInfo => {
                const extraOptions: ExtraCounterInfo = {
                    [COUNTER_STATE_CLICKMAP]:
                        !!counterState[COUNTER_STATE_CLICKMAP],
                };
                // shallow copy the object
                return mix({}, counterState, extraOptions);
            },
        );

        return errorLogger(
            ctx,
            'g.c.cc',
            pipe(
                bind(
                    globalConfig.getVal,
                    globalConfig,
                    COUNTERS_GLOBAL_KEY,
                    {},
                ),
                cKeys,
                ctxMap(iterateKeys),
            ),
        );
    },
);

/**
 * Writes flags in global config (closureStorage)
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 */
export const getCountersProvider = ctxErrorLogger(
    'gt.c.rs',
    (ctx: Window, counterOptions: CounterOptions) => {
        const counterKey = getCounterKey(counterOptions);
        const { id, counterType, clickmap, trackHash } = counterOptions;
        const destruct = bindArgs([ctx, counterKey], deleteVal);

        setVal(ctx, counterKey, {
            [COUNTER_STATE_ID]: id,
            [COUNTER_STATE_TYPE]: +counterType,
            [COUNTER_STATE_CLICKMAP]: clickmap,
            [COUNTER_STATE_TRACK_HASH]: !!trackHash,
        });

        return destruct;
    },
);
