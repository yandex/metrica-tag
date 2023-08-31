export type nullable = '' | 0 | undefined | null | false;

export type MapCallback<T, U> = (
    element: T,
    index: number,
    array?: ArrayLike<T>,
) => U;

export interface ArrayMap {
    <T, F>(fn: MapCallback<T, F>, array: ArrayLike<T>): F[];
    <T>(fn: MapCallback<T, T>, array: ArrayLike<T>): T[];
}

export type ForEachCallback<T> = (
    element: T,
    index: number,
    array?: ArrayLike<T>,
) => void;
export type ForEach = <T>(fn: ForEachCallback<T>, array: ArrayLike<T>) => void;

export type ReduceCallback<T, U> = (
    previousValue: U,
    currentValue: T,
    index: number,
    array?: ArrayLike<T>,
) => U;
export interface Reduce {
    <F>(fn: ReduceCallback<F, F>, first: F, array: ArrayLike<F>): F;
    <F, U>(fn: ReduceCallback<F, U>, first: U, array: ArrayLike<F>): U;
}

export type FlatMapCallback<T, U> = (
    element: T,
    index: number,
    array?: ArrayLike<T>,
) => U | U[];
export interface FlatMap {
    <T, U>(fn: FlatMapCallback<T, U>, array: ArrayLike<T>): U[];
}

export type IndexOf = <T>(searchElement: T, array: ArrayLike<T>) => number;
export type Join = <T>(separator: string, array: ArrayLike<T>) => string;

export type FindCallback<T> = (
    value: T,
    index: number,
    array?: ArrayLike<T>,
) => unknown;
export type Find = <T>(
    fn: FindCallback<T>,
    array: ArrayLike<T>,
) => T | undefined;

export type FilterCallback<T> = FindCallback<T>;
export type Filter = <T>(fn: FilterCallback<T>, array: ArrayLike<T>) => T[];

export type SomeCallback<T> = (
    value: T,
    index: number,
    array?: ArrayLike<T>,
) => unknown;
export type Some = <T>(fn: SomeCallback<T>, array: ArrayLike<T>) => boolean;

export type EveryCallback<T> = SomeCallback<T>;
export type Every = <T>(fn: EveryCallback<T>, array: ArrayLike<T>) => boolean;

export type Includes = <T>(
    searchElement: T,
    array: ArrayLike<T>,
    fromIndex?: number,
) => boolean;
