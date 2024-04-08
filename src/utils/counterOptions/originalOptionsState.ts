import { getGlobalStorage } from 'src/storage/global';

const COUNTER_OPTIONS_GLOBAL_STORAGE_KEY = 'cok';

export const saveOriginalOptions = (
    ctx: Window,
    counterKey: string,
    rawOptions: Record<string, unknown>,
) => {
    const globalStorage = getGlobalStorage(ctx);
    const optionsState: Record<string, Record<string, unknown>> =
        globalStorage.getVal(COUNTER_OPTIONS_GLOBAL_STORAGE_KEY, {});
    optionsState[counterKey] = rawOptions;
    globalStorage.setVal(COUNTER_OPTIONS_GLOBAL_STORAGE_KEY, optionsState);
};

export const deleteOriginalOptions = (ctx: Window, counterKey: string) => {
    const globalStorage = getGlobalStorage(ctx);
    const optionsState: Record<string, Record<string, unknown>> =
        globalStorage.getVal(COUNTER_OPTIONS_GLOBAL_STORAGE_KEY, {});
    delete optionsState[counterKey];
};

export const loadOriginalOptions = (ctx: Window, counterKey: string) => {
    const globalStorage = getGlobalStorage(ctx);
    const optionsState: Record<string, Record<string, unknown>> =
        globalStorage.getVal(COUNTER_OPTIONS_GLOBAL_STORAGE_KEY, {});
    return optionsState[counterKey];
};
