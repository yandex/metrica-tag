import { argsToArray } from 'src/utils/function/args';
import { dispatchDebuggerEvent } from './index';

type LogFn = (...data: any[]) => void;
export const wrapLogFunction = (
    ctx: Window,
    type: 'log' | 'warn' | 'error',
    counterKey: string,
    func: LogFn,
) => {
    return function l() {
        // eslint-disable-next-line prefer-rest-params
        const args = argsToArray(arguments);
        dispatchDebuggerEvent(ctx, {
            ['counterKey']: counterKey,
            ['name']: 'log',
            ['data']: {
                ['args']: args,
                ['type']: type,
            },
        });
        return func(...args);
    } as LogFn;
};
