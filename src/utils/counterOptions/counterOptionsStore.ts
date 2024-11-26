import { constructObject } from 'src/utils/function/construct';
import { memo } from 'src/utils/function/memo';
import { getCounterKey } from './getCounterKey';
import type { CounterOptions, RawCounterOptions } from './types';

type RawCounterOptionsState = {
    rawOptions?: RawCounterOptions;
};

export const getCounterOptionsState = memo(
    constructObject as (options: CounterOptions) => RawCounterOptionsState,
    getCounterKey,
);
