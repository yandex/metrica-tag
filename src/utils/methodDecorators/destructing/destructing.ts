import { CounterOptions } from 'src/utils/counterOptions';
import { getCounterInstance } from 'src/utils/counter';
import { argsToArray } from 'src/utils/function/args';

export function destructingDecorator<
    FN extends (...args: any) => ReturnType<FN>,
>(
    ctx: Window,
    counterOptions: CounterOptions,
    methodName: string,
    fn: FN,
): (...a: Parameters<FN>) => ReturnType<FN> | undefined {
    return function destructing() {
        const counter = getCounterInstance(ctx, counterOptions);
        if (!counter) {
            return undefined;
        }

        // eslint-disable-next-line prefer-rest-params
        const fnArgs = argsToArray(arguments);
        return fn(...fnArgs);
    };
}
