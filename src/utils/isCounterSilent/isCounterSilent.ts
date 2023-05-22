import { ctxIncludes } from 'src/utils/array';
import { getCounterKey } from 'src/utils/counterOptions/getCounterKey';
import { CounterOptions } from 'src/utils/counterOptions/types';
import { memo, pipe } from 'src/utils/function';
import { ctxPath } from 'src/utils/object';

export const ignoredCounters: number[] = [26812653];

export const isCounterIdSilent = ctxIncludes(ignoredCounters);

export const isCounterSilent = memo(
    pipe(ctxPath('id'), isCounterIdSilent) as (a: CounterOptions) => boolean,
    getCounterKey,
);
