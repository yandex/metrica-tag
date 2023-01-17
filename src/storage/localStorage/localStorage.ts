import { parse, stringify } from 'src/utils/json';
import { memo } from 'src/utils/function';
import { isNull, isUndefined } from 'src/utils/object';

export const DEFAULT_LS_PREFIX = '_ym';

export interface LocalStorage {
    isBroken: boolean;
    getVal<T>(name: string): T | null;
    getVal<T>(name: string, defVal: T): T;
    setVal<T>(name: string, val: T): LocalStorage;
    delVal(name: string): LocalStorage;
}

const getStorage = (ctx: Window): Storage | null => {
    try {
        return ctx.localStorage;
    } catch (e) {}
    return null;
};
const delItem = (ctx: Window, name: string): void => {
    const storage = getStorage(ctx);
    try {
        storage!.removeItem(name);
    } catch (e) {}
};

const getItem = (ctx: Window, name: string) => {
    const storage = getStorage(ctx);
    try {
        return parse(ctx, storage!.getItem(name));
    } catch (e) {}

    return null;
};

const setItem = (ctx: Window, name: string, rawVal: any) => {
    const storage = getStorage(ctx);
    const val = stringify(ctx, rawVal);
    if (!isNull(val)) {
        try {
            storage!.setItem(name, val);
        } catch (e) {}
    }
};

const isStorageBroken = memo((ctx: Window) => {
    const nameToCheck = `${DEFAULT_LS_PREFIX}BRC`;
    const value = '1';
    setItem(ctx, nameToCheck, value);
    const broken = value !== getItem(ctx, nameToCheck);
    if (!broken) {
        delItem(ctx, nameToCheck);
    }

    return broken;
});

const localStorage = (
    ctx: Window,
    nameSpace: string | number = '',
    prefix: string = DEFAULT_LS_PREFIX,
): LocalStorage => {
    const storageKey = `${prefix}${nameSpace}_`;
    const isBroken = isStorageBroken(ctx);

    return {
        isBroken,
        getVal<T>(name: string, defVal?: T) {
            const out = getItem(ctx, `${storageKey}${name}`) as T | null;
            if (isNull(out) && !isUndefined(defVal)) {
                return defVal;
            }
            return out;
        },
        setVal<T>(name: string, val: T) {
            setItem(ctx, `${storageKey}${name}`, val);
            return this;
        },
        delVal(name: string) {
            delItem(ctx, `${storageKey}${name}`);
            return this;
        },
    };
};

export const globalLocalStorage = memo(localStorage);

export const counterLocalStorage = memo(
    localStorage,
    (ctx, nameSpace, prefix) => `${nameSpace}${prefix}`,
);

export { localStorage };
