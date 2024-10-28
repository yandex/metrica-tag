import { getGlobalStorage } from 'src/storage/global';
import { CounterOptions } from '.';

const COUNTER_OPTIONS_GLOBAL_STORAGE_KEY = 'cok';

export const saveCounterOptions = (
    ctx: Window,
    counterKey: string,
    rawOptions: CounterOptions,
) => {
    const globalStorage = getGlobalStorage(ctx);
    const optionsState: Record<string, CounterOptions> = globalStorage.getVal(
        COUNTER_OPTIONS_GLOBAL_STORAGE_KEY,
        {},
    );
    optionsState[counterKey] = rawOptions;
    globalStorage.setVal(COUNTER_OPTIONS_GLOBAL_STORAGE_KEY, optionsState);
};

export const deleteCounterOptions = (ctx: Window, counterKey: string) => {
    const globalStorage = getGlobalStorage(ctx);
    const optionsState: Record<string, CounterOptions> = globalStorage.getVal(
        COUNTER_OPTIONS_GLOBAL_STORAGE_KEY,
        {},
    );
    delete optionsState[counterKey];
};

export const loadCounterOptions = (ctx: Window, counterKey: string) => {
    const globalStorage = getGlobalStorage(ctx);
    const optionsState: Record<string, CounterOptions> = globalStorage.getVal(
        COUNTER_OPTIONS_GLOBAL_STORAGE_KEY,
        {},
    );
    return optionsState[counterKey];
};
