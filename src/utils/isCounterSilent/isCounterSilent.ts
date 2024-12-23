import { ctxIncludes } from 'src/utils/array/includes';
import { getCounterKey } from 'src/utils/counterOptions/getCounterKey';
import { CounterOptions } from 'src/utils/counterOptions/types';
import { memo } from 'src/utils/function/memo';
import { ctxPath } from 'src/utils/object';
import { pipe } from 'src/utils/function/pipe';
import { parseIntSafe } from '../number/number';

export const ignoredCounters: number[] = [26812653];

export const isCounterIdSilent = ctxIncludes(ignoredCounters);

export const isCounterKeySilent = (counterKey: string) => {
    if (!counterKey) {
        return false;
    }
    const counterId = counterKey.split(':')[0];

    return isCounterIdSilent(parseIntSafe(counterId!)!);
};

export const isCounterSilent = memo(
    pipe(ctxPath('id'), isCounterIdSilent) as (a: CounterOptions) => boolean,
    getCounterKey,
);
