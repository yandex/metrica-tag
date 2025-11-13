import { PRERENDER_MW_BR_KEY } from 'src/api/watch';
import type { SenderInfo } from 'src/sender/SenderInfo';
import { isPrerender } from 'src/utils/browser/browser';
import { cEvent } from 'src/utils/events/events';
import type { MiddlewareGetter } from '../types';

declare global {
    interface DocumentEventMap {
        webkitvisibilitychange: Event;
        prerenderingchange: Event;
    }
}

const EVENTS = [
    'webkitvisibilitychange',
    'visibilitychange',
    'prerenderingchange',
] as const;

/**
 * If page is prerendered delays hit sending until it is visible
 * @param ctx - Current window
 */
export const prerender: MiddlewareGetter = (ctx: Window) => ({
    beforeRequest(senderParams: SenderInfo, next) {
        const { document: doc } = ctx;
        const { brInfo } = senderParams;
        if (brInfo && isPrerender(ctx)) {
            const event = cEvent(ctx);
            const onVisibilityChange = (e: Event) => {
                if (!isPrerender(ctx)) {
                    event.un(doc, EVENTS, onVisibilityChange);
                    next();
                }

                return e;
            };

            event.on(doc, EVENTS, onVisibilityChange);
            brInfo.setVal(PRERENDER_MW_BR_KEY, '1');
        } else {
            next();
        }
    },
});
