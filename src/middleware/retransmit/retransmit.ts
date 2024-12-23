import { flags } from '@inject';
import { TELEMETRY_FEATURE } from 'generated/features';
import { RETRANSMIT_BRINFO_KEY } from 'src/api/common';
import { config, host } from 'src/config';
import { MiddlewareGetter } from 'src/middleware/types';
import { SenderInfo } from 'src/sender/SenderInfo';
import { arrayJoin } from 'src/utils/array/join';
import { browserInfo } from 'src/utils/browserInfo/browserInfo';
import { CounterOptions } from 'src/utils/counterOptions';
import { getPath, isNull } from 'src/utils/object';
import { getMs, TimeOne } from 'src/utils/time/time';
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
    saveRetransmitLsState,
} from './state';
import { getHid } from '../watchSyncFlags/brinfoFlags/hid';

declare module 'src/sender/SenderInfo' {
    interface MiddlewareInfo {
        /** Count of retransmits */
        retransmitIndex?: number;
    }
}

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
        [LS_RESOURCE]: senderParams.urlInfo!.resource!, // The resource shall be always set within provider middleware.
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

/**
 * Saves requests in local storage. If sent successfully deletes it,
 * otherwise the request stays in the local storage available for retransmitting.
 *
 * NOTE: The retransmit middleware should be able to pick all flags set on the request.
 * Therefore you need keep it at the end of the middleware chain.
 *
 * @param ctx - Current window
 * @param opt - Counter options
 */
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
 * Updates retry index for the request being retransmitted.
 * Deletes the request from local storage if sent successfully.
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
