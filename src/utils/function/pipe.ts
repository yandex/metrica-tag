import { F as Func } from 'ts-toolbelt';

export const pipe: Func.Pipe = function b() {
    const fns = arguments;
    const firstFn = fns[0];
    return function pipeStartFunction() {
        let out = firstFn.apply(null, arguments as unknown as unknown[]);
        const len = fns.length;
        let i = 1;
        while (i < len) {
            out = fns[i](out);
            i += 1;
        }
        return out;
    };
};

export const dirtyPipe = pipe; // тоже самое что pipe, но он может иметь сайд эффекты
