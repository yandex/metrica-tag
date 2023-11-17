import { T as Tuple, A as Any } from 'ts-toolbelt';
import type { SliceFrom } from 'src/utils/types';

export type AnyFunc = (...args: any[]) => any;
export type ParamsTail<F extends AnyFunc> = Tuple.Tail<Parameters<F>>;
export type ParamsFirst<F extends AnyFunc> = Parameters<F>[0];
export type FuncRest<F extends AnyFunc, R = ReturnType<F>> = (
    ...args: ParamsTail<F>
) => R; // проверка для generic ф-ций

export type Bind = <
    FN extends AnyFunc,
    C extends any,
    F extends any[],
    V extends Parameters<FN>,
>(
    f: FN,
    ctx: C,
    ...args: F
) => // eslint-disable-next-line no-shadow
(...args: Tuple.Diff<V, F>) => ReturnType<FN>;

export type BindArg = {
    <F extends AnyFunc>(firstArg: ParamsFirst<F>, fn: F): FuncRest<F>;
    (firstArg: unknown): <F extends AnyFunc>(fn: F) => FuncRest<F>;
};

export type SliceArgs<F extends AnyFunc, L extends Partial<Parameters<F>>> =
    SliceFrom<Parameters<F>, Any.Cast<L, any[]>>;

export type BindArgs = {
    // eslint-disable-next-line no-shadow,no-use-before-define
    <A extends Partial<Parameters<F>>, F extends AnyFunc>(args: A, fn: F): (
        ...ar: SliceArgs<F, A>
    ) => ReturnType<F>;
    // eslint-disable-next-line no-shadow,no-use-before-define
    <A extends Partial<Parameters<F>>, F extends AnyFunc>(args: A): (
        fn: F,
    ) => (...ar: SliceArgs<F, A>) => ReturnType<F>;
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
