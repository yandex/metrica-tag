import { flags } from '@inject';
import { RETRANSMIT_BRINFO_KEY } from 'src/api/common';
import { config, host } from 'src/config';
import { MiddlewareGetter } from 'src/middleware/types';
import { SenderInfo } from 'src/sender/SenderInfo';
import { CounterOptions } from 'src/utils/counterOptions';
import { getMs, TimeOne } from 'src/utils/time/time';
import { sendRetransmitRequests } from 'src/providers/retransmit/sendRetransmitRequests';
import { MAX_REQUESTS } from './const';
import { getHid } from '../watchSyncFlags/brinfoFlags/hid';
import {
    getRetransmitState,
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
    RetransmitState,
} from './state';

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
    retransmitState: RetransmitState,
) => {
    const { brInfo, telemetry, urlParams, transportInfo = {} } = senderParams;
    if (!brInfo || !urlParams) {
        return;
    }

    const timeOne = TimeOne(ctx);
    brInfo.setOrNot(RETRANSMIT_BRINFO_KEY, 1);

    const retransmitRequest: RetransmitInfo = {
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

    if (flags.TELEMETRY_FEATURE && telemetry) {
        retransmitRequest[LS_TELEMETRY] = telemetry.ctx();
    }
    const retransmitIndex = retransmitState.add(retransmitRequest);

    if (!senderParams.middlewareInfo) {
        senderParams.middlewareInfo = {};
    }
    senderParams.middlewareInfo.retransmitIndex = retransmitIndex;
};

export const unRegisterRequest = (
    ctx: Window,
    senderParams: SenderInfo,
    opt: CounterOptions,
    retransmitState: RetransmitState,
) => {
    const { brInfo } = senderParams;
    if (!brInfo || !senderParams.middlewareInfo) {
        return;
    }
    const retransmitIndex = senderParams.middlewareInfo.retransmitIndex!;
    retransmitState.delete(retransmitIndex);

    if (retransmitState.length() >= MAX_REQUESTS) {
        const readyToRetransmit = retransmitState.clear();
        sendRetransmitRequests(ctx, opt, readyToRetransmit);
    }
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
) => {
    const retransmitState = getRetransmitState(ctx);
    return {
        beforeRequest: (senderParams: SenderInfo, next) => {
            registerRequest(ctx, senderParams, opt, retransmitState);
            next();
        },
        afterRequest: (senderParams: SenderInfo, next) => {
            unRegisterRequest(ctx, senderParams, opt, retransmitState);
            next();
        },
    };
};
