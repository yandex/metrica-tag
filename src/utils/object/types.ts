export interface Entries {
    <T, K extends string = string>(o?: { [s in K]: T } | ArrayLike<T>): [
        K,
        T,
    ][];
    <T>(o?: { [s: string]: T } | ArrayLike<T>): [string, T][];
    // eslint-disable-next-line @typescript-eslint/ban-types -- object allows application of entries to object without index signature.
    (o?: object): [string, unknown][];
}

export type Keys = (o: Record<string, unknown>) => string[];
