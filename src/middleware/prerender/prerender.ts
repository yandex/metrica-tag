import { PRERENDER_MW_BR_KEY } from 'src/api/watch';
import { cEvent, EventSetter } from 'src/utils/events';
import { SenderInfo } from 'src/sender/SenderInfo';
import { isPrerender } from 'src/utils/browser';
import { MiddlewareGetter } from '../types';

const EVENTS = ['webkitvisibilitychange', 'visibilitychange'];

/**
 * If page is prerendered delays hit sending until it is visible
 * @param ctx - Current window
 */
const prerender: MiddlewareGetter = (ctx: Window) => ({
    beforeRequest(senderParams: SenderInfo, next) {
        const { document: doc } = ctx as any;
        const { brInfo } = senderParams;
        if (brInfo && isPrerender(ctx)) {
            const event: EventSetter = cEvent(ctx);
            const onVisibilityChange = (e: any) => {
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

export { prerender };
