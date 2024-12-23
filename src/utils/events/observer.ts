import { ctxMapSwap } from 'src/utils/array/map';
import { cIndexOf } from 'src/utils/array/indexOf';
import { pipe } from 'src/utils/function/pipe';
import { bindArg, bindThisForMethod } from 'src/utils/function/bind';
import { FirstArgOfType, firstArg } from 'src/utils/function/identity';
import { curry2SwapArgs } from 'src/utils/function/curry';
import { call } from 'src/utils/function/utils';

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
