import { flags } from '@inject';
import { TELEMETRY_FEATURE } from 'generated/features';
import { RETRANSMIT_BRINFO_KEY } from 'src/api/watch';
import { cReduce, cSome } from 'src/utils/array';
import { ctxErrorLogger } from 'src/utils/errorLogger';
import { cont } from 'src/utils/function';
import { parseDecimalInt } from 'src/utils/number';
import { entries } from 'src/utils/object';
import { TimeOne, getMs } from 'src/utils/time';
import {
    RetransmitInfo,
    getRetransmitLsState,
    LS_HID,
    LS_TIME,
    RETRANSMIT_EXPIRE,
    LS_BRINFO,
    LS_PROTOCOL,
    LS_HOST,
    LS_RESOURCE,
    LS_POST,
    LS_PARAMS,
    LS_COUNTER,
    LS_COUNTER_TYPE,
    LS_TELEMETRY,
} from '../../middleware/retransmit/state';
import { getHid } from '../../middleware/watchSyncFlags/brinfoFlags/hid';
import { RETRANSMITTABLE_RESOURCE_CALLBACKS } from './const';

export const getRetransmitRequestsRaw = (ctx: Window): RetransmitInfo[] => {
    const time = TimeOne(ctx);
    const requests = getRetransmitLsState(ctx);
    const currentTime = time(getMs);
    const hid = getHid(ctx);
    return cReduce(
        (result, [key, req]) => {
            if (
                req &&
                cSome(
                    cont(req[LS_RESOURCE]),
                    RETRANSMITTABLE_RESOURCE_CALLBACKS,
                ) &&
                !req.d && // Do not handle locked requests
                req[LS_HID] &&
                req[LS_HID] !== hid &&
                req[LS_TIME] &&
                currentTime - req[LS_TIME] > 500 && // skip the requests that might soon resolve in an iframe
                req[LS_TIME] + RETRANSMIT_EXPIRE > currentTime &&
                req[LS_BRINFO][RETRANSMIT_BRINFO_KEY] <= 2
            ) {
                req.d = 1;
                const parsedRequest: RetransmitInfo = {
                    protocol: req[LS_PROTOCOL],
                    host: req[LS_HOST],
                    resource: req[LS_RESOURCE],
                    postParams: req[LS_POST],
                    params: req[LS_PARAMS],
                    browserInfo: req[LS_BRINFO],
                    ghid: req[LS_HID],
                    time: req[LS_TIME],
                    retransmitIndex: parseDecimalInt(key),
                    counterId: req[LS_COUNTER],
                    counterType: req[LS_COUNTER_TYPE],
                };

                if (flags[TELEMETRY_FEATURE] && req[LS_TELEMETRY]) {
                    parsedRequest.telemetry = req[LS_TELEMETRY];
                }

                result.push(parsedRequest);
            }
            return result;
        },
        [] as RetransmitInfo[],
        entries(requests),
    );
};

export const getRetransmitRequests = ctxErrorLogger(
    'g.r',
    getRetransmitRequestsRaw,
);
