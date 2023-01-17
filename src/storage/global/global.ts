import { isUndefined } from 'src/utils/object/assertions';
import { hasOwnProperty } from 'src/utils/object/has';

export type GlobalStorage = {
    setSafe<T>(name: string, value: T): GlobalStorage;
    setVal<T>(name: string, value: T): GlobalStorage;
    getVal<T>(name: string, defVal?: T): T;
};
export const yaNamespace = 'Ya';
export const metrikaNamespace = '_metrika';

export type Storage = {
    [metrikaNamespace]?: {
        [key: string]: any;
    };
};

export type GlobalCtx = {
    [yaNamespace]?: Storage;
};

export const globalStorage = (ctx: Window): GlobalStorage => {
    /* eslint-disable no-multi-assign */
    const winCtx = ctx as GlobalCtx;
    const yan = (winCtx[yaNamespace] = winCtx[yaNamespace] || {});
    const metrika = (yan[metrikaNamespace] = yan[metrikaNamespace] || {});
    const storage: Record<string, any> = metrika;

    return {
        setSafe<T>(name: string, value: T): GlobalStorage {
            if (!hasOwnProperty.call(storage, name)) {
                storage[name] = value;
            }
            return this;
        },
        setVal<T>(name: string, value: T): GlobalStorage {
            storage[name] = value;
            return this;
        },
        getVal<T>(name: string, defVal?: T): T {
            const val = storage[name] as T;
            if (!hasOwnProperty.call(storage, name) && !isUndefined(defVal)) {
                return defVal;
            }
            return val;
        },
    };
};
