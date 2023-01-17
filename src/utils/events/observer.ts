import { cIndexOf, ctxMapSwap } from 'src/utils/array';
import {
    pipe,
    bindArg,
    firstArg,
    bindThisForMethod,
    call,
    curry2SwapArgs,
    FirstArgOfType,
} from 'src/utils/function';

export type Listener<T, U> = (data: T) => U;

export type Observer<T, U> = {
    listeners: Listener<T, U>[];
    on: (cb: Listener<T, U>) => Observer<T, U>;
    off: (cb: Listener<T, U>) => Observer<T, U>;
    trigger: (data?: T) => U[];
};

export const observer = <T, U>(ctx: Window): Observer<T, U> => {
    const listeners: Listener<T, U>[] = [];
    const self: Partial<Observer<T, U>> = {};
    self.listeners = listeners;
    self.on = pipe(
        bindThisForMethod('push', listeners),
        bindArg(
            self as Observer<T, U>,
            firstArg as FirstArgOfType<Observer<T, U>>,
        ),
    );
    self.off = pipe(
        curry2SwapArgs(cIndexOf(ctx))(listeners),
        curry2SwapArgs(bindThisForMethod('splice', listeners))(1),
        bindArg(
            self as Observer<T, U>,
            firstArg as FirstArgOfType<Observer<T, U>>,
        ),
    );
    self.trigger = pipe(
        firstArg,
        curry2SwapArgs(call as any),
        ctxMapSwap(listeners),
    );
    return self as Observer<T, U>;
};
