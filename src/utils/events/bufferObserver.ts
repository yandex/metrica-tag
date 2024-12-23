import { ctxMapSwap } from '../array/map';
import { observer, Observer } from './observer';

// сохраняет N событий из потока
// и тригерит их у вновь подписавшихся

export const bufferObserver = <T, U>(
    ctx: Window,
    sourceObserver: Observer<T, U>,
    maxBuffer: number,
): Observer<T, U> => {
    const resultObserver = observer<T, U>(ctx);
    const buffer: T[] = [];
    sourceObserver.on((data) => {
        buffer.push(data);
        if (buffer.length > maxBuffer) {
            buffer.shift();
        }
        return resultObserver.trigger(data) as any;
    });
    resultObserver.on = ctxMapSwap(buffer) as any;
    return resultObserver;
};
