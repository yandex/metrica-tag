import { setDefer } from 'src/utils/defer';
import { noop } from 'src/utils/function';
import { getRandom } from 'src/utils/number';
import { cEvent } from 'src/utils/events';
import { errorLogger } from 'src/utils/errorLogger';

const defaultScope = 'as';

export const runAsync = (
    ctx: Window,
    fn: (...args: any[]) => any,
    errorScope?: string,
) => {
    const scope = errorScope || defaultScope;

    // postMessage может быть синхронным в старых браузерах
    // пример можно посмотреть в Vow - https://github.com/dfilatov/vow/blob/master/lib/vow.js#L53
    // чтобы не писать такую же проверку, просто используем в таких браузер setTimeout
    if (ctx.postMessage && !(ctx as any).attachEvent) {
        const events = cEvent(ctx);
        const msg = `__ym__promise_${getRandom(ctx)}_${getRandom(ctx)}`;
        let un = noop;

        const onMessage = errorLogger(ctx, scope, (event: MessageEvent) => {
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
        });

        un = events.on(ctx, ['message'], onMessage);
        ctx.postMessage(msg, '*');
    } else {
        setDefer(ctx, fn, 0, scope);
    }
};
