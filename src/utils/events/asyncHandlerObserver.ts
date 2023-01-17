import { iterateTaskWithConstraints } from '../async';
import { asSideEffect, pipe } from '../function';
import { Observer, observer } from './observer';

// разбивает поток выполнения
// в зависимости от сложности обработки событий из потока
// каждого обработчика

export const asyncHandlerObserver = <T, U>(
    ctx: Window,
    sourceObserver: Observer<T, U>,
    maxTime: number,
): Observer<T, U> => {
    const resultObserver = observer<T, U>(ctx);
    sourceObserver.listeners.push((data) => {
        return resultObserver.trigger(data) as any;
    });
    resultObserver.on = pipe(
        asSideEffect(sourceObserver.on),
        resultObserver.on,
    );
    resultObserver.trigger = ((data: T) => {
        iterateTaskWithConstraints(
            ctx,
            resultObserver.listeners,
            (fn: Function) => {
                return fn(data);
            },
            maxTime,
        );
    }) as any;
    return resultObserver;
};
