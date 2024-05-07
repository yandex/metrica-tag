import { getCounterInstance } from 'src/utils/counter';
import { CounterObject } from 'src/utils/counter/type';
import { isUndefined } from 'src/utils/object';
import { argsToArray } from '../function/args';
import type { Decorator } from './types';

export const selfReturnDecorator: Decorator<CounterObject | undefined, true> = (
    ctx,
    counterOptions,
    methodName,
    fn,
) => {
    return function selfReturn() {
        // eslint-disable-next-line prefer-rest-params
        const fnArgs = argsToArray(arguments);
        const result = fn(...fnArgs);
        if (isUndefined(result)) {
            const counter = getCounterInstance(ctx, counterOptions);
            return counter;
        }

        return result;
    };
};
