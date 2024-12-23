import { getNativeFunction } from 'src/utils/function/isNativeFunction/getNativeFunction';
import type { AnyFunc } from '../function/types';

// Без errorLogger - для избежания циклических зависимостей в транспортах и callForeignCallback
export const setDeferBase = (
    ctx: Window,
    fn: AnyFunc,
    timeOut: number,
): number => {
    const setTimeout: Window['setTimeout'] = getNativeFunction(
        'setTimeout',
        ctx,
    );
    // eslint-disable-next-line ban/ban
    return setTimeout(fn, timeOut);
};
