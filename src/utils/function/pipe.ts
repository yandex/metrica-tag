import { F as Func } from 'ts-toolbelt';
import { cReduce } from 'src/utils/array/reduce';
import { argsToArray } from './args';
import { cCont } from './cont';
import { AnyFunc } from './types';

export const pipe: Func.Pipe = function b<Fns extends AnyFunc[]>() {
    const fnList: Func.Piper<Fns> = argsToArray(arguments) as any;
    const firstFn = fnList.shift();
    return function pipeStartFunction() {
        // @ts-ignore
        const firstResult = firstFn!(...arguments);
        return cReduce(cCont, firstResult, fnList);
    };
};

export const dirtyPipe = pipe; // тоже самое что pipe, но он может иметь сайд эффекты
