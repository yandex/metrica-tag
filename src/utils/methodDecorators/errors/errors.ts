import { CounterOptions } from 'src/utils/counterOptions';
import { errorLogger } from 'src/utils/errorLogger';

export function errorsDecorator<FN extends (...args: any) => ReturnType<FN>>(
    ctx: Window,
    counterOptions: CounterOptions,
    methodName: string,
    fn: FN,
) {
    return errorLogger(ctx, `cm.${methodName}`, fn);
}
