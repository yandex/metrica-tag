import { CounterOptions, getCounterKey } from 'src/utils/counterOptions';
import { getGlobalStorage } from 'src/storage/global';
import { CounterObject } from './type';

export const COUNTERS_GLOBAL_KEY = 'counters';

export const getCounterInstance = (
    ctx: Window,
    counterOptions: CounterOptions,
): CounterObject | undefined => {
    const storage = getGlobalStorage(ctx);
    const dict = storage.getVal<Record<string, CounterObject | undefined>>(
        COUNTERS_GLOBAL_KEY,
        {},
    );
    const counterKey = getCounterKey(counterOptions);
    return dict[counterKey];
};

export const removeCounter = (ctx: Window, counterKey: string) => {
    const counters = getGlobalStorage(ctx).getVal<Record<string, any>>(
        COUNTERS_GLOBAL_KEY,
        {},
    );
    delete counters[counterKey];
};
