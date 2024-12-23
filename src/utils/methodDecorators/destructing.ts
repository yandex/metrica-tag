import { getCounterInstance } from 'src/utils/counter/getInstance';
import { argsToArray } from 'src/utils/function/args';
import type { Decorator } from './types';

export const destructingDecorator: Decorator<unknown> = (
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
