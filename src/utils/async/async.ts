import { setDefer } from 'src/utils/defer/defer';
import { noop } from 'src/utils/function/noop';
import { getRandom } from 'src/utils/number/random';
import { cEvent } from 'src/utils/events/events';
import { errorLogger } from 'src/utils/errorLogger/errorLogger';

export const runAsync = (
    ctx: Window,
    fn: (...args: any[]) => any,
    errorScope: string,
) => {
    // postMessage может быть синхронным в старых браузерах
    // пример можно посмотреть в Vow - https://github.com/dfilatov/vow/blob/master/lib/vow.js#L53
    // чтобы не писать такую же проверку, просто используем в таких браузер setTimeout
    if (ctx.postMessage && !(ctx as any).attachEvent) {
        const events = cEvent(ctx);
        const msg = `__ym__promise_${getRandom(ctx)}_${getRandom(ctx)}`;
        let un = noop;

        const onMessage = errorLogger(
            ctx,
            errorScope,
            (event: MessageEvent) => {
                let data: any;
                try {
                    ({ data } = event);
                } catch (e) {
                    return;
                }
                if (data === msg) {
                    un();

                    if (event.stopPropagation) {
                        event.stopPropagation();
                    }

                    fn();
                }
            },
        );

        un = events.on(ctx, ['message'], onMessage);
        ctx.postMessage(msg, '*');
    } else {
        setDefer(ctx, fn, 0, errorScope);
    }
};
