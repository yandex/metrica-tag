import { cMap } from 'src/utils/array/map';
import type { CounterOptions } from 'src/utils/counterOptions';
import { pipe } from 'src/utils/function/pipe';
import type { AnyFunc } from 'src/utils/function/types';
import { bindArgs } from 'src/utils/function/bind';
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
            bindArgs(
                [ctx, counterOptions, methodName],
                decorator as Decorator<R>,
            ),
        decorators,
    );
    return pipe(...fnList)(method);
}
