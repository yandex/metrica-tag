import { ctxErrorLogger } from 'src/utils/errorLogger';

import {
    getResourceUrl,
    setupUtilsAndLoadScript,
} from 'src/providers/remoteControl/remoteControl';
import { getStatusCheckSearchParams } from 'src/providers/statusCheck/urlSearchParams';
import { CounterOptions } from 'src/utils/counterOptions';
import { setDefer } from 'src/utils/defer';
import { bindArgs } from 'src/utils/function';
import { DEFAULT_COUNTER_TYPE } from '../counterOptions';

export const CHK_STATUS_KEY = 'cs';

export const checkStatusRaw = (ctx: Window, counterOptions: CounterOptions) => {
    const { id, lang } = getStatusCheckSearchParams(ctx);

    if (
        id &&
        counterOptions.id === id &&
        counterOptions.counterType === DEFAULT_COUNTER_TYPE
    ) {
        const src = getResourceUrl(ctx, {
            ['lang']: lang,
            ['fileId']: 'status',
        });
        setDefer(
            ctx,
            bindArgs([ctx, src, `${id}`], setupUtilsAndLoadScript),
            0,
            CHK_STATUS_KEY,
        );
    }
};

/**
 * Checks if counter with specified id found on page
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 */
export const checkStatus = ctxErrorLogger('cs.init', checkStatusRaw);
