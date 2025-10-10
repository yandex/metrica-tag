import { COUNTER_ID_PARAM } from 'src/api/common';
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
import type { TransportOptions } from 'src/transport/types';
import { browserInfo } from 'src/utils/browserInfo/browserInfo';
import { mix } from 'src/utils/object';
import { COLLECT_RESOURCE } from './const';

export const senderCollectInfo: MiddlewareGetter = (ctx, counterOptions) => ({
    beforeRequest(senderParams, next) {
        const cSenderInfo = senderParams;
        const { urlParams } = cSenderInfo;
        const collectUrlParams: UrlParams = {
            [WATCH_URL_PARAM]: (urlParams && urlParams[WATCH_URL_PARAM]) || '',
            [WATCH_ENCODING_PARAM]: 'utf-8',
            [COUNTER_ID_PARAM]: `${counterOptions.id}`,
        };
        if (counterOptions.counterType !== DEFAULT_COUNTER_TYPE) {
            collectUrlParams[WATCH_CLASS_PARAM] = counterOptions.counterType;
        }
        if (!cSenderInfo.brInfo) {
            cSenderInfo.brInfo = browserInfo();
        }
        const { brInfo } = cSenderInfo;
        const { transportInfo = {} } = cSenderInfo;
        const newSenderInfo: SenderInfo = {
            urlInfo: {
                resource: COLLECT_RESOURCE,
            },
            transportInfo: mix(transportInfo, {
                wmode:
                    !!brInfo.getVal(PAGE_VIEW_BR_KEY) &&
                    !brInfo.getVal(TRACK_HASH_BR_KEY),
            } as TransportOptions),
            urlParams: mix(cSenderInfo.urlParams || {}, collectUrlParams),
        };
        mix(cSenderInfo, newSenderInfo);

        next();
    },
});
