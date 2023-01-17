export type FirstArgOfType<T> = (a: T) => T;

export const firstArg = <T>(a: T): T => a;

export const secondArg = <E, T>(a?: E, b?: T): T | undefined => b;

export const notFn = (res: any) => !res;
