import { yaNamespace } from 'src/const';
import { isUndefined } from 'src/utils/object/assertions';
import { has } from 'src/utils/object/has';

export type GlobalStorage = {
    setSafe<T>(name: string, value: T): GlobalStorage;
    setVal<T>(name: string, value: T): GlobalStorage;
    getVal<T>(name: string, defVal?: T): T;
};

export const metrikaNamespace = '_metrika';

declare global {
    interface yaNamespaceStorage {
        [metrikaNamespace]?: Record<string, unknown>;
    }
}

export const globalStorage = (ctx: Window): GlobalStorage => {
    const yan = (ctx[yaNamespace] = ctx[yaNamespace] || {});
    const metrika = (yan[metrikaNamespace] = yan[metrikaNamespace] || {});

    const storage: Record<string, any> = metrika;

    return {
        setSafe<T>(name: string, value: T): GlobalStorage {
            if (!has(storage, name)) {
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
            if (!has(storage, name) && !isUndefined(defVal)) {
                return defVal;
            }
            return val;
        },
    };
};
