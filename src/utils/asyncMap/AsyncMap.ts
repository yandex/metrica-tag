import { PolyPromise } from 'src/utils';
import { curry2, cont, constructObject, pipe, memo } from '../function';

type StoreType<ValT> = {
    [key: string]: {
        promise: Promise<ValT>;
        resolveCallback?: Function;
        resolved: boolean;
        rValue?: ValT;
    };
};

export const setAsync =
    <ValT>(key: string, val: ValT) =>
    (rawStore: StoreType<ValT>) => {
        const store = rawStore;
        const value = store[key];
        if (value) {
            value.rValue = val;
            value.resolved = true;

            if (value.resolveCallback) {
                value.resolveCallback(val);
            } else {
                value.promise = PolyPromise.resolve(val);
            }
        } else {
            store[key] = {
                promise: PolyPromise.resolve(val),
                rValue: val,
                resolved: true,
            };
        }
    };

export const getAsync = curry2(
    <ValT>(key: string, rawStore: StoreType<ValT>): Promise<ValT> => {
        const store = rawStore;
        const value = store[key];
        if (!value) {
            let resolveCallback: (
                resolveValue: ValT | PromiseLike<ValT>,
            ) => void;
            const promise = new PolyPromise<ValT>((resolve) => {
                resolveCallback = resolve;
            });
            store[key] = {
                resolveCallback: resolveCallback!,
                promise,
                resolved: false,
            };
        }

        return store[key].promise;
    },
) as any as (
    key: string,
    // eslint-disable-next-line no-use-before-define
) => <T extends any>(rawStore: StoreType<T>) => Promise<T>;

export const AsyncMapFn = memo(pipe(constructObject, cont)) as any as <
    ValT,
    // eslint-disable-next-line no-use-before-define
>() => <R>(fn: (st: StoreType<ValT>) => R) => R;
