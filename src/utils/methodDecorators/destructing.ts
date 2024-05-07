import { getCounterInstance } from 'src/utils/counter';
import { argsToArray } from 'src/utils/function/args';
import type { Decorator } from './types';

export const destructingDecorator: Decorator<undefined> = (
    ctx,
    counterOptions,
    methodName,
    fn,
) => {
    return function destructing() {
        const counter = getCounterInstance(ctx, counterOptions);
        if (!counter) {
            return undefined;
        }

        // eslint-disable-next-line prefer-rest-params
        const fnArgs = argsToArray(arguments);
        return fn(...fnArgs);
    };
};
