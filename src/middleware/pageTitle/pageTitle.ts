import { TITLE_BR_KEY } from 'src/api/watch';
import type { MiddlewareGetter } from 'src/middleware/types';
import type { SenderInfo } from 'src/sender/SenderInfo';
import type { BrowserInfo } from 'src/utils/browserInfo';
import { getPath } from 'src/utils/object';
import { getNativeFunction } from 'src/utils/function/isNativeFunction';
import { config } from 'src/config';
import type { CounterOptions } from 'src/utils/counterOptions';
import { SEND_TITLE_FEATURE } from 'generated/features';
import { flags } from '@inject';

declare module 'src/sender/SenderInfo' {
    interface MiddlewareInfo {
        /** Page title */
        title?: string;
    }
}

export const setTitle = (
    ctx: Window,
    brInfo: BrowserInfo,
    senderParams: SenderInfo,
    counterOpts?: CounterOptions,
) => {
    if (flags[SEND_TITLE_FEATURE] && counterOpts && !counterOpts.sendTitle) {
        return;
    }

    let { title } = ctx.document;
    if (senderParams.middlewareInfo && senderParams.middlewareInfo.title) {
        ({ title } = senderParams.middlewareInfo);
    }
    const fn = getNativeFunction('getElementsByTagName', ctx.document);
    if (typeof title !== 'string' && fn) {
        const buf = fn('title');
        const innerHTML = getPath(buf, '0.innerHtml');
        if (innerHTML) {
            title = innerHTML;
        } else {
            title = '';
        }
    }
    title = title.slice(0, config.MAX_LEN_TITLE);
    brInfo.setVal(TITLE_BR_KEY, title);
};

/**
 * Sets flag with page title
 * @param ctx - Current window
 * @param opts - Counter options on initialization
 */
export const pageTitle: MiddlewareGetter = (
    ctx: Window,
    opts: CounterOptions,
) => ({
    beforeRequest: (senderParams: SenderInfo, next) => {
        const { brInfo } = senderParams;
        if (!brInfo) {
            next();
            return;
        }
        setTitle(ctx, brInfo, senderParams, opts);
        next();
    },
});
