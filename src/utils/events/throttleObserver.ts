import { setDefer } from 'src/utils/defer/defer';
import { noop } from '../function/noop';
import { observer, Observer } from './observer';

export const throttleObserver = <T, U>(
    ctx: Window,
    rawObserver: Observer<T, U>,
    timeOut: number,
) => {
    const throttledObserver: Observer<T, U> = observer(ctx);
    let timer: number;
    let callNextTime = false;
    let latestData: T;
    const cb = () => {
        timer = 0;
        if (callNextTime) {
            callNextTime = false;
            timer = setDefer(ctx, cb, timeOut);
            throttledObserver.trigger(latestData);
        }
    };
    rawObserver.on((data) => {
        callNextTime = true;
        latestData = data;
        if (!timer) {
            cb();
        }
        return noop as any;
    });
    return throttledObserver;
};
