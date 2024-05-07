import { cMap } from 'src/utils/array';
import type { CounterOptions } from 'src/utils/counterOptions';
import { bindArgs, pipe } from 'src/utils/function';
import type { AnyFunc } from 'src/utils/function/types';
import type { Decorator } from './types';

export function decoratorPipe<
    R,
    DecoratorList extends Decorator<R>,
    CounterMethod extends (...args: unknown[]) => ReturnType<CounterMethod>,
>(
    ctx: Window,
    counterOptions: CounterOptions,
    decorators: DecoratorList[],
    methodName: string,
    method: CounterMethod,
) {
    if (!decorators.length) {
        return method;
    }
    const fnList = cMap(
        (decorator): ((fn: CounterMethod) => AnyFunc) =>
            bindArgs([ctx, counterOptions, methodName], decorator),
        decorators,
    );
    return pipe(...fnList)(method);
}
