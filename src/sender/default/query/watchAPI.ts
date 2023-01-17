import { TELEMETRY_FEATURE } from 'generated/features';
import { flags } from '@inject';
import {
    TRANSPORT_ID_BR_KEY,
    BROWSERINFO_QUERY_KEY,
    TELEMETRY_QUERY_KEY,
} from 'src/api/common';
import { SENDER_TIME_BR_KEY } from 'src/api/watch';
import { browserInfo } from 'src/utils/browserInfo';
import { mix } from 'src/utils/object';
import { TimeOne, getSec } from 'src/utils/time';
import type { SenderInfo } from '../../SenderInfo';

export const createWatchQuery = (
    ctx: Window,
    senderInfo: SenderInfo,
    transportID: number,
) => {
    const query: Record<string, string> = mix({}, senderInfo.urlParams);
    const time = TimeOne(ctx);
    if (senderInfo.brInfo) {
        query[BROWSERINFO_QUERY_KEY] = browserInfo(senderInfo.brInfo.ctx())
            .setVal(SENDER_TIME_BR_KEY, time(getSec))
            .serialize();
    }

    if (flags[TELEMETRY_FEATURE]) {
        if (!query[TELEMETRY_QUERY_KEY]) {
            const { telemetry } = senderInfo;
            if (telemetry) {
                telemetry.setVal(TRANSPORT_ID_BR_KEY, transportID);
                query[TELEMETRY_QUERY_KEY] = telemetry.serialize();
            }
        }
    }

    return query;
};
