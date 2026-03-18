import { ctxMapSwap } from '../array/map';
import { createBuffer } from '../buffer/buffer';
import { observer, Observer } from './observer';

// сохраняет N событий из потока
// и тригерит их у вновь подписавшихся

export const bufferObserver = <T, U>(
    ctx: Window,
    sourceObserver: Observer<T, U>,
    maxBuffer: number,
): Observer<T, U> => {
    const resultObserver = observer<T, U>(ctx);
    const buffer = createBuffer<T>(maxBuffer);
    sourceObserver.on((data) => {
        buffer.push(data);
        return resultObserver.trigger(data) as any;
    });
    resultObserver.on = ctxMapSwap(buffer.bufferArray) as any;
    return resultObserver;
};
