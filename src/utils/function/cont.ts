export const cCont = <T, R>(arg: T, fn: (_arg: T) => R): R => {
    return fn(arg);
};
