import { ctxErrorLogger } from 'src/utils/errorLogger/errorLogger';
import { CounterOptions } from 'src/utils/counterOptions';
import { createAndDispatchEvent } from 'src/utils/dom/dom';
import { runAsync } from 'src/utils/async/async';
import { bindArgs } from 'src/utils/function/bind';

/**
 * Triggers event yacounterXXXXXinited on counter initialization
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 */
export const useTriggerEvent = ctxErrorLogger(
    'trigger.in',
    (ctx: Window, { id, triggerEvent }: CounterOptions) => {
        if (!triggerEvent) {
            return;
        }

        const eventName = `yacounter${id}inited`;

        runAsync(
            ctx,
            bindArgs([ctx, eventName], createAndDispatchEvent),
            't.i',
        );
    },
);
