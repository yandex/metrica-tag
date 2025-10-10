import {
    PAGE_VIEW_BR_KEY,
    TRACK_HASH_BR_KEY,
    WATCH_CLASS_PARAM,
    WATCH_ENCODING_PARAM,
    WATCH_URL_PARAM,
} from 'src/api/watch';
import type { MiddlewareGetter } from 'src/middleware/types';
import { DEFAULT_COUNTER_TYPE } from 'src/providers/counterOptions';
import type { SenderInfo, UrlParams } from 'src/sender/SenderInfo';
import { browserInfo } from 'src/utils/browserInfo/browserInfo';
import { mix } from 'src/utils/object';
import { WATCH_RESOURCE } from './const';

/**
 * Sets basic values for senderWatch sender. Values may be modified in providers.
 * For example url parameters, counter type, brInfo and wmode (backend response type)
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 */
export const senderWatchInfo: MiddlewareGetter = (ctx, counterOptions) => ({
    beforeRequest(senderParams, next) {
        const cSenderInfo = senderParams;
        const { urlParams } = cSenderInfo;
        const watchUrlParams: UrlParams = {
            [WATCH_URL_PARAM]: (urlParams && urlParams[WATCH_URL_PARAM]) || '',
            [WATCH_ENCODING_PARAM]: 'utf-8',
        };
        if (counterOptions.counterType !== DEFAULT_COUNTER_TYPE) {
            watchUrlParams[WATCH_CLASS_PARAM] = counterOptions.counterType;
        }
        if (!cSenderInfo.brInfo) {
            cSenderInfo.brInfo = browserInfo();
        }
        const { brInfo } = cSenderInfo;
        const { transportInfo = {} } = cSenderInfo;
        const newSenderInfo: SenderInfo = {
            urlInfo: {
                resource: `${WATCH_RESOURCE}/${counterOptions.id}`,
            },
            transportInfo: mix(transportInfo, {
                wmode:
                    !!brInfo.getVal(PAGE_VIEW_BR_KEY) &&
                    !brInfo.getVal(TRACK_HASH_BR_KEY),
            }),
            urlParams: mix(cSenderInfo.urlParams || {}, watchUrlParams),
        };
        mix(cSenderInfo, newSenderInfo);

        next();
    },
});
