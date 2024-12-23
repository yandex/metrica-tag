import { PolyPromise } from 'src/utils/promise';
import { curry2, cont } from 'src/utils/function/curry';
import { noop } from 'src/utils/function/noop';
import { memo } from 'src/utils/function/memo';
import { pipe } from 'src/utils/function/pipe';
import { constructObject } from 'src/utils/function/construct';

type StoreType<ValT> = {
    [key: string]: {
        readonly promise: Promise<ValT>;
        readonly resolveCallback: (value: ValT) => void;
        resolved: boolean;
    };
};

export const setAsync =
    <ValT>(key: string, val: ValT) =>
    (rawStore: StoreType<ValT>) => {
        const store = rawStore;
        const value = store[key];
        if (value) {
            value.resolved = true;
            value.resolveCallback(val);
        } else {
            store[key] = {
                promise: PolyPromise.resolve(val),
                resolved: true,
                resolveCallback: noop,
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
) as (key: string) => <T>(rawStore: StoreType<T>) => Promise<T>;

export const AsyncMapFn = memo(pipe(constructObject, cont)) as <ValT>() => <R>(
    fn: (st: StoreType<ValT>) => R,
) => R;
