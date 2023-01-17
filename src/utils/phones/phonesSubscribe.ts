import { cEvent, Observer } from 'src/utils/events';
import { waitForBodyTask } from 'src/utils/dom/waitForBody';
import { isNativeFunction, noop } from 'src/utils/function';
import { taskFork } from '../async';

export const phoneSubscribeLoad = (
    ctx: Window,
    observerObj: Observer<unknown, unknown>,
) => {
    const eventSubscriber = cEvent(ctx);
    return eventSubscriber.on(ctx, ['load'], observerObj.trigger);
};

export const phoneSubscribeMutation = (
    ctx: Window,
    observerObj: Observer<unknown, unknown>,
) => {
    waitForBodyTask(ctx)(
        taskFork(noop, () => {
            const target = ctx.document.body;
            const config = {
                ['attributes']: true,
                ['childList']: true,
                ['subtree']: true,
            };
            if (!isNativeFunction('MutationObserver', ctx.MutationObserver)) {
                return;
            }
            const mutationObserver = new MutationObserver(observerObj.trigger);
            mutationObserver.observe(target, config);
        }),
    );
};
