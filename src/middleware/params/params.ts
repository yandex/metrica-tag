import { DEFER_KEY, REQUEST_BODY_KEY, PAGE_VIEW_BR_KEY } from 'src/api/watch';
import { MiddlewareGetter } from 'src/middleware/types';
import { stringify } from 'src/utils/json';
import { config } from 'src/config';
import { memo, equal, pipe, constructArray } from 'src/utils/function';
import {
    CounterOptions,
    getCounterKey,
    setTurboInfo,
} from 'src/utils/counterOptions';
import { METHOD_NAME_PARAMS } from 'src/providers/params/const';
import { BrowserInfo } from 'src/utils/browserInfo';
import { cFilter, cForEach, head, indexOfWin } from 'src/utils/array';
import type { SenderInfo } from 'src/sender/SenderInfo';
import { getCounterInstance } from 'src/utils/counter';
import { flags } from '@inject';
import { dispatchDebuggerEvent } from 'src/providers/debugEvents';
import { DEBUG_EVENTS_FEATURE } from 'generated/features';

declare module 'src/sender/SenderInfo' {
    interface MiddlewareInfo {
        /** Visit parameters */
        params?: Record<string, any>;
    }
}

const getParamsState = memo(
    constructArray as (a: Window) => [BrowserInfo, Record<string, any>][],
);

const handleParams = (
    ctx: Window,
    counterOptions: CounterOptions,
    cSenderParams: SenderInfo,
) => {
    const senderParams = cSenderParams;
    const { params } = senderParams.middlewareInfo || {};
    const { transportInfo = {} } = senderParams;
    if (params) {
        setTurboInfo(counterOptions, params);

        if (
            !transportInfo.rBody &&
            senderParams.brInfo &&
            senderParams.urlParams
        ) {
            const paramsString = stringify(ctx, params);
            const state = getParamsState(ctx);
            const isHit = senderParams.brInfo.getVal(PAGE_VIEW_BR_KEY);
            if (!paramsString || senderParams.urlParams[DEFER_KEY]) {
                return;
            }
            if (flags[DEBUG_EVENTS_FEATURE]) {
                dispatchDebuggerEvent(ctx, {
                    counterKey: getCounterKey(counterOptions),
                    name: 'params',
                    data: {
                        val: params,
                    },
                });
            }
            if (!isHit) {
                transportInfo.rBody = paramsString;
                senderParams.transportInfo = transportInfo;
                if (!senderParams.privateSenderInfo) {
                    senderParams.privateSenderInfo = {};
                }
                senderParams.privateSenderInfo.noRedirect = true;
            } else if (
                encodeURIComponent(paramsString).length >
                config.MAX_LEN_SITE_INFO
            ) {
                state.push([senderParams.brInfo, params]);
            } else {
                senderParams.urlParams[REQUEST_BODY_KEY] = paramsString;
            }
        }
    }
};

/**
 * Handles visit parameters of request
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 */
export const paramsMiddleware: MiddlewareGetter = (
    ctx: Window,
    counterOptions,
) => ({
    beforeRequest: (cSenderParams, next) => {
        handleParams(ctx, counterOptions, cSenderParams);
        next();
    },
    afterRequest: (senderParams, next) => {
        const state = getParamsState(ctx);
        const counterInstance = getCounterInstance(ctx, counterOptions);
        const paramsFn = counterInstance && counterInstance[METHOD_NAME_PARAMS];

        if (paramsFn) {
            const list = cFilter(pipe(head, equal(senderParams.brInfo)), state);
            cForEach((item) => {
                const [, params] = item;

                paramsFn(params);

                const index = indexOfWin(ctx)(item, state);
                state.splice(index, 1);
            }, list);
        }
        next();
    },
});
