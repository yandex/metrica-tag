import { flags } from '@inject';
import { DEFER_KEY, PAGE_VIEW_BR_KEY, REQUEST_BODY_KEY } from 'src/api/watch';
import type { MiddlewareGetter } from 'src/middleware/types';
import { METHOD_NAME_PARAMS } from 'src/providers/params/const';
import type { SenderInfo } from 'src/sender/SenderInfo';
import { cFilter } from 'src/utils/array/filter';
import { cForEach } from 'src/utils/array/map';
import { head, indexOfWin } from 'src/utils/array/utils';
import { isIE } from 'src/utils/browser/browser';
import type { BrowserInfo } from 'src/utils/browserInfo/browserInfo';
import { getCounterInstance } from 'src/utils/counter/getInstance';
import { getCounterKey } from 'src/utils/counterOptions/getCounterKey';
import type { CounterOptions, Params } from 'src/utils/counterOptions/types';
import { dispatchDebuggerEvent } from 'src/utils/debugEvents';
import { constructArray } from 'src/utils/function/construct';
import { equal } from 'src/utils/function/curry';
import { memo } from 'src/utils/function/memo';
import { pipe } from 'src/utils/function/pipe';
import { stringify } from 'src/utils/json';
import { setTurboInfo } from 'src/utils/turboParams';

declare module 'src/sender/SenderInfo' {
    interface MiddlewareInfo {
        /** Visit parameters */
        params?: Params;
    }
}

const getParamsState = memo(
    constructArray as (a: Window) => [BrowserInfo, Params][],
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
        if (flags.TURBO_PARAMS_FEATURE) {
            setTurboInfo(counterOptions, params);
        }

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
            if (flags.DEBUG_EVENTS_FEATURE) {
                dispatchDebuggerEvent(ctx, {
                    ['counterKey']: getCounterKey(counterOptions),
                    ['name']: 'params',
                    ['data']: {
                        ['val']: params,
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
                (isIE(ctx) ? 512 : 2048)
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
