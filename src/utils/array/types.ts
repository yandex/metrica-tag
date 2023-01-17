export interface Filter {
    <T, R = T>(
        fn: (item: T, i?: number) => boolean,
        array: T[] | readonly T[],
    ): R[];
}

export type FindFn<T> = (
    fn: (
        value: T,
        index?: number | undefined,
        obj?: T[] | undefined,
    ) => boolean,
    array: T[] | readonly T[],
) => T | undefined;

export type nullable = '' | 0 | undefined | null;

export interface ArrayMap {
    <T, F>(fn: (el: T, i: number) => F, array: readonly T[]): F[];
    <T>(fn: (el: T, i: number) => T, array: readonly T[]): T[];
}
export interface Every {
    <T>(fn: (item: T, i?: number) => boolean, array: T[]): boolean;
}
export interface Some {
    <T>(fn: (item: T, i?: number) => boolean, array: T[]): boolean;
}
export interface Reduce {
    <F>(fn: (prev: F, next: F, i: number) => F, first: F, array: F[]): F;
    <F, U>(fn: (prev: U, next: F, i: number) => U, first: U, array: F[]): U;
    <F, U>(
        fn: (prev: U, next: F, i: number) => U,
        first: U,
        array: readonly F[],
    ): U;
}
export interface FlatMap {
    <T, F>(fn: (el: T, i: number) => F[] | F, array: T[]): F[];
}
