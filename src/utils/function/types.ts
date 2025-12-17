import { T as Tuple, A as Any } from 'ts-toolbelt';
import type { SliceFrom } from 'src/utils/types';

export type AnyFunc = (...args: any[]) => any;
export type AnyConstructor = new (...args: any[]) => any;
export type ParamsTail<F extends AnyFunc> = Tuple.Tail<Parameters<F>>;
export type ParamsFirst<F extends AnyFunc> = Parameters<F>[0];
export type FuncRest<F extends AnyFunc, R = ReturnType<F>> = (
    ...args: ParamsTail<F>
) => R; // проверка для generic ф-ций

type FirstAsTuple<T extends any[]> = T extends [...infer H, ...infer R]
    ? H
    : never;

export type FirstNArg<FN, Result extends [] = []> = FN extends (
    ...args: infer Args
) => any
    ? Result | Args['length'] extends 0 | 1
        ? never
        : Args extends [any, ...infer Tail]
          ?
                | []
                | FirstAsTuple<Args>
                | [
                      ...FirstAsTuple<Args>,
                      ...FirstNArg<(...args: Tail) => ReturnType<FN>>,
                  ]
          : any[]
    : never;

export type FirstArg<FN> = Extract<FirstNArg<FN>, [any]>;

export type ReturnBoundFunc<
    FN extends AnyFunc,
    Args extends FirstNArg<FN>,
> = FN extends (...args: [...Args, ...infer T]) => ReturnType<FN>
    ? (...args: T) => ReturnType<FN>
    : never;

export type Bind = <FN extends AnyFunc, C, Args extends FirstNArg<FN>>(
    f: FN,
    ctx: C,
    ...bindArgs: Args
) => ReturnBoundFunc<FN, Args>;

export type BindArg = <FN extends AnyFunc, Arg extends Parameters<FN>[0]>(
    bindArg: Arg,
    f: FN,
) => ReturnBoundFunc<
    FN,
    // @ts-expect-error - FIXME
    [Arg]
>;

export type SliceArgs<
    F extends AnyFunc,
    L extends Partial<Parameters<F>>,
> = SliceFrom<Parameters<F>, Any.Cast<L, any[]>>;

export type BindArgs = {
    <A extends Partial<Parameters<F>>, F extends AnyFunc>(
        args: A,
        fn: F,
    ): (...ar: SliceArgs<F, A>) => ReturnType<F>;
    <A extends Partial<Parameters<F>>, F extends AnyFunc>(
        args: A,
    ): (fn: F) => (...ar: SliceArgs<F, A>) => ReturnType<F>;
};

export type CallUserCallback = (
    ctx: Window,
    callback?: AnyFunc,
    userContext?: any,
    ...args: any[]
) => void;

export type BindThisForMethod = {
    <O, K extends keyof O = keyof O>(name: K, obj: O): O[K];
    <S extends string>(name: S): <O extends Record<S, any>>(obj: O) => O[S];
};

export type ObjectsWithMethods = Record<string, any>;
export type MethodsOf<T> = {
    [K in keyof T as T[K] extends AnyFunc ? K : never]: T[K];
};
