import { CounterOptions } from 'src/utils/counterOptions';
import { getCounterInstance } from 'src/utils/counter';
import { isUndefined } from 'src/utils/object';
import { argsToArray } from '../../function/args';

export function selfReturnDecorator<
    FN extends (...args: any) => ReturnType<FN>,
>(ctx: Window, counterOptions: CounterOptions, methodName: string, fn: FN) {
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
}
