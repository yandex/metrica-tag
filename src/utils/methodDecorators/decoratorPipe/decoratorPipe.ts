import { bindArgs, pipe } from 'src/utils/function';
import { CounterOptions } from 'src/utils/counterOptions';
import { cReduce } from 'src/utils/array';

export function decoratorPipe<
    DecoratorList extends (...args: any) => ReturnType<DecoratorList>,
    CounterMethod extends (...args: any) => ReturnType<CounterMethod>,
>(
    ctx: Window,
    counterOptions: CounterOptions,
    decorators: DecoratorList[],
    methodName: string,
    method: CounterMethod,
) {
    if (!decorators.length || !method) {
        return method;
    }
    const fnList = bindArgs(
        cReduce(
            (
                decrs: ((...args: any) => DecoratorList)[],
                decorator: DecoratorList,
                i: number,
            ) => {
                if (!decorators[i]) {
                    return decrs;
                }
                return decrs.concat(
                    bindArgs([ctx, counterOptions, methodName], decorator),
                );
            },
            [],
            decorators,
        ),
        pipe,
    );
    return fnList()(method);
}
