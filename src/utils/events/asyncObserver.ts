import { includes } from '../array';
import { iterateTaskWithConstraints } from '../async';
import { bindArg, call } from '../function';
import { observer, Observer } from './observer';

// разбивает поток выполнения
// в зависимости от сложности обработки событий из потока
// множеством обработчиков

export const asyncObserver = <T, U>(
    ctx: Window,
    sourceObserver: Observer<T, U>,
    maxTime: number,
): Observer<T, U> => {
    const resultObserver = observer<T, U>(ctx);
    let buffer: Function[] = [];
    let inProgress = false;

    const recursive = (): any => {
        if (!buffer.length) {
            inProgress = false;
            return;
        }
        inProgress = true;
        if (!includes(recursive, buffer)) {
            buffer.push(recursive);
        }
        const bufferCopy = buffer.slice();
        buffer = [];
        iterateTaskWithConstraints(ctx, bufferCopy, call, maxTime);
    };

    sourceObserver.on((data) => {
        buffer.push(bindArg(data, resultObserver.trigger));
        if (!inProgress) {
            recursive();
        }
        return undefined as any;
    });
    return resultObserver;
};
