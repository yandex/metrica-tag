export interface Entries {
    <T, K extends string = string>(o?: { [s in K]: T } | ArrayLike<T>): [
        K,
        T,
    ][];
    <T>(o?: { [s: string]: T } | ArrayLike<T>): [string, T][];
    (o?: {}): [string, any][];
}

export type Keys = (o: object) => string[];
