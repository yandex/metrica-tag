import type { CounterOptions } from 'src/utils/counterOptions/types';

export type Decorator<A = never, E extends boolean = false> = <
    FN extends (...args: any[]) => ReturnType<FN>,
    R extends ReturnType<FN>,
>(
    ctx: Window,
    counterOptions: CounterOptions,
    methodName: string,
    fn: FN,
) => (...args: Parameters<FN>) => E extends true ? R | A : A;
