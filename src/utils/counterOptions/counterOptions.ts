import { RSYA_COUNTER_TYPE } from 'src/providers/counterOptions/const';
import type { OptionsKeysMaps } from 'src/providers/counterOptions/types';
import { cReduce } from 'src/utils/array/reduce';
import { equal } from 'src/utils/function/curry';
import { entries, isObject } from 'src/utils/object';
import type {
    CounterOptions,
    CounterTypeInterface,
    RawCounterOptions,
} from './types';

// NOTE: Extend the type in order to be able to check all string inputs.
export const isRsyaCounter = equal<CounterTypeInterface | string>(
    RSYA_COUNTER_TYPE,
);

export const normalizeOriginalOptions = (
    counterId: RawCounterOptions | number,
    counterParams?: Record<string, unknown>,
    counterType?: number,
    counterDefer?: boolean,
): RawCounterOptions =>
    isObject(counterId)
        ? counterId
        : {
              ['id']: counterId,
              ['type']: counterType,
              ['defer']: counterDefer,
              ['params']: counterParams,
          };

export const normalizeOptions = (
    counterData: RawCounterOptions,
    optionsKeysMap: OptionsKeysMaps,
): CounterOptions =>
    cReduce(
        (
            acc: Record<string, unknown>,
            [obfuscatedKey, { optKey: key, normalizeFunction: normalize }],
        ) => {
            const value = counterData[key];
            acc[obfuscatedKey] = normalize ? normalize(value) : value;

            return acc;
        },
        {},
        entries(optionsKeysMap),
    ) as unknown as CounterOptions;
