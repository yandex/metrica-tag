import { cEvent } from 'src/utils/events/events';
import { waitForBodyTask } from 'src/utils/dom/waitForBody';
import { noop } from 'src/utils/function/noop';
import { isNativeFunction } from 'src/utils/function/isNativeFunction';
import { taskFork } from '../async/task';
import { Observer } from '../events/observer';

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
