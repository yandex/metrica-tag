import { cCont } from './cont';
import { AnyFunc } from './types';

export const curry2 =
    <A, B, R>(func: (a: A, b: B) => R) =>
    (a: A) =>
    (b: B) =>
        func(a, b);

export const curry2SwapArgs =
    <A, B, R>(func: (a: A, b: B) => R) =>
    (b: B) =>
    (a: A) =>
        func(a, b);

export const equal: <T>(a: T) => (b: T) => boolean = curry2((a, b) => {
    return a === b;
});

/**
 * Run a function with argument and return the argument
 */
export const asSideEffect = curry2(
    <F extends AnyFunc, A extends Parameters<F>[0]>(fn: F, arg: A) => {
        fn(arg);
        return arg;
    },
);

/**
 * continuation monad
 */
export const cont = curry2(cCont);
