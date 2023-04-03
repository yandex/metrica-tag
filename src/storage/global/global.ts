import { yaNamespace } from 'src/const';
import { isUndefined } from 'src/utils/object/assertions';
import { hasOwnProperty } from 'src/utils/object/has';

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
    /* eslint-disable no-multi-assign */
    const yan = (ctx[yaNamespace] = ctx[yaNamespace] || {});
    const metrika = (yan[metrikaNamespace] = yan[metrikaNamespace] || {});
    /* eslint-enable no-multi-assign */
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
