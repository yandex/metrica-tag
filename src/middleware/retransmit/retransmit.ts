import { RETRANSMIT_BRINFO_KEY } from 'src/api/common';
import { config, host } from 'src/config';
import { MiddlewareGetter } from 'src/middleware/types';
import { SenderInfo } from 'src/sender/SenderInfo';
import { WATCH_RESOURCE } from 'src/middleware/senderWatchInfo';
import { globalLocalStorage } from 'src/storage/localStorage';
import { arrayJoin, cReduce } from 'src/utils/array';
import { browserInfo } from 'src/utils/browserInfo';
import { CounterOptions } from 'src/utils/counterOptions';
import { ctxErrorLogger } from 'src/utils/errorLogger';
import { parseDecimalInt } from 'src/utils/number';
import { entries, getPath, isNull } from 'src/utils/object';
import { getMs, TimeOne } from 'src/utils/time';
import { flags } from '@inject';
import { TELEMETRY_FEATURE } from 'generated/features';
import {
    getRetransmitLsState,
    LS_BRINFO,
    LS_COUNTER,
    LS_COUNTER_TYPE,
    LS_HID,
    LS_HOST,
    LS_PARAMS,
    LS_POST,
    LS_PROTOCOL,
    LS_RESOURCE,
    LS_TELEMETRY,
    LS_TIME,
    RetransmitInfo,
    RETRANSMIT_EXPIRE,
    RETRANSMIT_KEY,
} from './state';
import { getHid } from '../watchSyncFlags/brinfoFlags/hid';

declare module 'src/sender/SenderInfo' {
    interface MiddlewareInfo {
        /** Count of retransmits */
        retransmitIndex?: number;
    }
}

/**
 * Тут вся логика на мутации запомненного объекта
 */
const saveRetransmitLsState = (ctx: Window) => {
    const retransmitLsRequests = getRetransmitLsState(ctx);
    const ls = globalLocalStorage(ctx);
    ls.setVal(RETRANSMIT_KEY, retransmitLsRequests);
};

export const getRetransmitRequestsRaw = (ctx: Window): RetransmitInfo[] => {
    const time = TimeOne(ctx);
    const requests = getRetransmitLsState(ctx);
    const currentTime = time(getMs);
    const hid = getHid(ctx);
    return cReduce(
        (result, [key, req]) => {
            if (
                req &&
                // однажды на window отдаем ретрансмиты
                !req.d &&
                req[LS_HID] &&
                req[LS_HID] !== hid &&
                req[LS_TIME] &&
                /*
                    не нужно пытаться ретрасмитить запросы которые
                    еще выполнятся в соседнем iframe
                */
                currentTime - req[LS_TIME] > 500 &&
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

export const registerRequest = (
    ctx: Window,
    senderParams: SenderInfo,
    opt: CounterOptions,
) => {
    const { brInfo, telemetry, urlParams, transportInfo = {} } = senderParams;
    if (!brInfo || !urlParams) {
        return;
    }

    const timeOne = TimeOne(ctx);
    brInfo.setOrNot(RETRANSMIT_BRINFO_KEY, 1);
    const reqList = getRetransmitLsState(ctx);

    let retransmitIndex = 1;
    while (reqList[retransmitIndex]) {
        retransmitIndex += 1;
    }

    if (!senderParams.middlewareInfo) {
        senderParams.middlewareInfo = {};
    }
    senderParams.middlewareInfo.retransmitIndex = retransmitIndex;

    reqList[retransmitIndex] = {
        [LS_PROTOCOL]: config.cProtocol,
        [LS_HOST]: host,
        [LS_RESOURCE]: WATCH_RESOURCE,
        [LS_POST]: transportInfo.rBody,
        [LS_TIME]: timeOne(getMs),
        [LS_COUNTER_TYPE]: opt.counterType,
        [LS_PARAMS]: urlParams,
        [LS_BRINFO]: brInfo.ctx(),
        [LS_COUNTER]: opt.id,
        [LS_HID]: getHid(ctx),
    };

    if (flags[TELEMETRY_FEATURE] && telemetry) {
        reqList[retransmitIndex][LS_TELEMETRY] = telemetry.ctx();
    }

    saveRetransmitLsState(ctx);
};

export const unRegisterRequest = (ctx: Window, senderParams: SenderInfo) => {
    const reqList = getRetransmitLsState(ctx);
    const { brInfo } = senderParams;
    if (!brInfo || isNull(reqList) || !senderParams.middlewareInfo) {
        return;
    }
    const retransmitIndex = senderParams.middlewareInfo.retransmitIndex!;
    delete reqList[retransmitIndex];

    saveRetransmitLsState(ctx);
};

export const retransmit: MiddlewareGetter = (
    ctx: Window,
    opt: CounterOptions,
) => ({
    beforeRequest: (senderParams: SenderInfo, next) => {
        registerRequest(ctx, senderParams, opt);
        next();
    },
    afterRequest: (senderParams: SenderInfo, next) => {
        unRegisterRequest(ctx, senderParams);
        next();
    },
});

/**
 * Retransmits request if it's not sent successfully
 * @param ctx - Current window
 */
export const retransmitProviderMiddleware: MiddlewareGetter = (
    ctx: Window,
) => ({
    beforeRequest: (senderParams: SenderInfo, next) => {
        const { brInfo = browserInfo(), middlewareInfo } = senderParams;
        const { retransmitIndex } = middlewareInfo!;
        const reqList = getRetransmitLsState(ctx);

        const prevRetry = brInfo.getVal(RETRANSMIT_BRINFO_KEY, 0);
        const currentRetry = prevRetry + 1;
        brInfo.setVal(RETRANSMIT_BRINFO_KEY, currentRetry);
        const localStorageBrInfo = getPath(
            reqList,
            arrayJoin('.', [retransmitIndex, LS_BRINFO]),
        );

        // Do not use invalid data
        if (localStorageBrInfo) {
            localStorageBrInfo[RETRANSMIT_BRINFO_KEY] = currentRetry;
            saveRetransmitLsState(ctx);
        }

        next();
    },

    afterRequest: (senderParams: SenderInfo, next) => {
        unRegisterRequest(ctx, senderParams);
        next();
    },
});
