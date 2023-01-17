import { includes } from 'src/utils/array';
import { cEvent } from 'src/utils/events/events';

import { runAsync } from 'src/utils/async';

const INTERACTIVE_READY_STATE = 'interactive';
const COMPLETE_READY_STATE = 'complete';

export const runCallbackOnReady = (
    ctx: Window,
    callback: (...args: any) => any,
): void => {
    const { document: doc } = ctx;
    const state: string = doc.readyState;
    if (includes(state, [INTERACTIVE_READY_STATE, COMPLETE_READY_STATE])) {
        runAsync(ctx, callback);
    } else {
        const { on, un } = cEvent(ctx);
        const onload = () => {
            un(doc, ['DOMContentLoaded'], onload);
            un(ctx, ['load'], onload);
            callback();
        };
        on(doc, ['DOMContentLoaded'], onload);
        on(ctx, ['load'], onload);
    }
};
