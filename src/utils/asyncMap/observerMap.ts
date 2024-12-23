import { observer, Observer } from '../events/observer';
import { asyncHandlerObserver } from '../events/asyncHandlerObserver';
import { bufferObserver } from '../events/bufferObserver';
import { cont, curry2 } from '../function/curry';
import { memo } from '../function/memo';

type ObserverItem<T> = {
    originalObserver: Observer<T, any>;
    observer: Observer<T, any>;
};

type StoreType<ValT> = {
    [key: string]: ObserverItem<ValT> | Window;
};

export const setVal =
    <ValT>(key: string, val: ValT) =>
    (rawStore: StoreType<ValT>) => {
        const store = rawStore;
        const ctx = store.ctx as Window;
        const value = store[key] as ObserverItem<ValT>;
        if (value) {
            value.originalObserver.trigger(val);
        } else {
            const observerObj = observer<ValT, any>(ctx);
            const bufferObserverObj = bufferObserver<ValT, any>(
                ctx,
                observerObj,
                1,
            );
            const asyncObserverObj = asyncHandlerObserver(
                ctx,
                bufferObserverObj,
                20,
            );
            store[key] = {
                originalObserver: observerObj,
                observer: asyncObserverObj,
            };
            observerObj.trigger(val);
        }
    };

export const getVal = curry2(<ValT>(key: string, rawStore: StoreType<ValT>) => {
    const store = rawStore;
    const ctx = store.ctx as Window;
    const value = store[key] as ObserverItem<ValT>;
    if (!value) {
        const observerObj = observer<ValT, any>(ctx);
        const bufferObserverObj = bufferObserver<ValT, any>(
            ctx,
            observerObj,
            1,
        );
        const asyncObserverObj = asyncHandlerObserver(
            ctx,
            bufferObserverObj,
            5,
        );
        store[key] = {
            originalObserver: observerObj,
            observer: asyncObserverObj,
        };
        return asyncObserverObj;
    }
    return value.observer;
}) as (key: string) => <T>(rawStore: StoreType<T>) => Observer<T, any>;

export const observerMapFn = memo((ctx: Window) => {
    const store = { ctx };
    return cont(store);
}) as <ValT>(ctx: Window) => <R>(fn: (st: StoreType<ValT>) => R) => R;
