import { flags } from '@inject';
import { TELEMETRY_FEATURE } from 'generated/features';
import type { RetransmitInfo } from 'src/middleware/retransmit';
import { getSender } from 'src/sender';
import type { SenderInfo } from 'src/sender/SenderInfo';
import type { TransportResponse } from 'src/transport/types';
import { PolyPromise } from 'src/utils/promise';
import { cReduce } from 'src/utils/array/reduce';
import { browserInfo } from 'src/utils/browserInfo/browserInfo';
import type { CounterOptions } from 'src/utils/counterOptions';
import { getCounterSettings } from 'src/utils/counterSettings/counterSettings';
import { errorLogger } from 'src/utils/errorLogger/errorLogger';
import { bindArg, bindArgs } from 'src/utils/function/bind/bind';
import { telemetry } from 'src/utils/telemetry/telemetry';
import type { ProviderResultPromised } from 'src/types';
import { firstArg } from 'src/utils/function/identity';
import type { ReduceCallback } from 'src/utils/array/types';
import { RETRANSMIT_PROVIDER } from './const';
import { getRetransmitRequests } from './getRetransmitRequests';

/**
 * Looks for saved requests in local storage and tries to retransmit them
 * @param ctx - Current window
 * @param counterOpt - Counter options during initialization
 */
export const useRetransmitProvider = (
    ctx: Window,
    counterOpt: CounterOptions,
): ProviderResultPromised => {
    const retransmitRequests = getRetransmitRequests(ctx);
    const retransmitSender = getSender(ctx, RETRANSMIT_PROVIDER, counterOpt);
    const errorCatcher = errorLogger(ctx, 'rts.p') as () => void;
    const makeRetransmit: ReduceCallback<
        RetransmitInfo,
        Promise<TransportResponse | void>
    > = (prev, req) => {
        const counterOptions: CounterOptions = {
            id: req.counterId,
            counterType: req.counterType,
        };

        const senderInfo: SenderInfo = {
            transportInfo: { rBody: req.postParams },
            brInfo: browserInfo(req.browserInfo),
            urlParams: req.params,
            middlewareInfo: {
                retransmitIndex: req.retransmitIndex,
            },
            urlInfo: {
                resource: req.resource,
            },
        };

        if (flags[TELEMETRY_FEATURE] && req.telemetry) {
            senderInfo.telemetry = telemetry(req.telemetry);
        }

        const result = retransmitSender(senderInfo, counterOptions).catch(
            errorCatcher,
        );

        return prev.then(bindArg(result, firstArg<typeof result>));
    };

    return getCounterSettings(
        counterOpt,
        bindArgs(
            [makeRetransmit, PolyPromise.resolve(), retransmitRequests],
            cReduce<RetransmitInfo, Promise<TransportResponse | void>>,
        ),
    )
        .then(bindArg(undefined, firstArg<void>))
        .catch(errorCatcher);
};
