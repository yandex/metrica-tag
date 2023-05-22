import { flags } from '@inject';
import { TURBO_PARAMS_FEATURE } from 'generated/features';
import { RSYA_COUNTER_TYPE } from 'src/providers/counterOptions/const';
import { OptionsKeysMaps } from 'src/providers/counterOptions/types';
import { cReduce } from 'src/utils/array';
import { equal } from 'src/utils/function';
import { entries } from 'src/utils/object';
import { setTurboInfo } from 'src/utils/turboParams';
import { CounterOptions, CounterTypeInterface } from './types';

// NOTE: Extend the type in order to be able to check all string inputs.
export const isRsyaCounter =
    equal<CounterTypeInterface | string>(RSYA_COUNTER_TYPE);

export const getOriginalOptions = (
    counterOptions: CounterOptions,
    optionsKeysMap: OptionsKeysMaps,
): CounterOptions => {
    return cReduce(
        (futureOptions: Record<string, any>, [obfuscatedKey, value]) => {
            const { optKey } = optionsKeysMap[obfuscatedKey];

            futureOptions[optKey] = value;

            return futureOptions;
        },
        {},
        entries(counterOptions),
    ) as unknown as CounterOptions;
};

export const normalizeOptions = (
    counterId: Record<string, unknown> | number,
    optionsKeysMap: OptionsKeysMaps,
    counterParams?: Record<string, unknown>,
    counterType?: number,
    counterDefer?: boolean,
): CounterOptions => {
    const counterData: Record<string, unknown> =
        typeof counterId === 'object'
            ? counterId
            : {
                  id: counterId,
                  counterType,
                  counterDefer,
                  params: counterParams,
              };

    const options = cReduce(
        (
            acc: Record<string, any>,
            [obfuscatedKey, { optKey: key, normalizeFunction: normalize }],
        ) => {
            const value = counterData[key];
            acc[obfuscatedKey] = normalize ? normalize(value) : value;

            return acc;
        },
        {},
        entries(optionsKeysMap),
    ) as unknown as CounterOptions;

    if (flags[TURBO_PARAMS_FEATURE]) {
        setTurboInfo(options, options.params || {});
    }

    return options;
};
