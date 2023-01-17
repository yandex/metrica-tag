import { arrayJoin } from '../array/join';
import { cCont } from './cont';

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

/**
 * @type function(...?): ?
 */
export const equal: <T>(a: T) => (b: T) => boolean = curry2((a, b) => {
    return a === b;
});

/**
 * @type function(...?): ?
 */
export const asSideEffect = curry2((fn: Function, arg: any) => {
    fn(arg);
    return arg;
}) as any;

export interface CtxJoin {
    <A>(str: string, array: A[]): string;
    <A>(str: string): (array: A[]) => string;
    <A>(): (str: string, array: A[]) => string;
}

export const ctxJoin: CtxJoin = curry2(arrayJoin) as any;

/**
 * continuation monad
 */
export const cont = curry2(cCont);
