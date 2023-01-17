import { mix } from 'src/utils/object';
import { getGlobalStorage } from 'src/storage/global';
import { cont } from 'src/utils/function';
import { StateManager } from './types';

export const GLOBAL_STORAGE_KEY = 'dsjf';

export const createStateManager = <S>(): StateManager<S> => {
    const state = {};
    return cont(state);
};

export const closureStorage = <S>(ctx: Window): StateManager<S> => {
    const globalStorage = getGlobalStorage(ctx);
    const stateManager =
        (globalStorage.getVal(GLOBAL_STORAGE_KEY) as StateManager<S>) ||
        createStateManager();
    globalStorage.setSafe(GLOBAL_STORAGE_KEY, stateManager);
    return stateManager;
};

export const getVal = <S>(ctx: Window, key: string): Partial<S> => {
    let value = {};
    closureStorage(ctx)((state) => {
        value = state[key] || {};
    });
    return value;
};

export const setVal = <S>(ctx: Window, key: string, val: Partial<S>) => {
    closureStorage(ctx)((state) => {
        const prevValue = state[key] || {};
        state[key] = mix(prevValue, val);
    });
};

export const deleteVal = <S>(ctx: Window, key: string) => {
    closureStorage(ctx)((state) => {
        delete state[key];
    });
};
