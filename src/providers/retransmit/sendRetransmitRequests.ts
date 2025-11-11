import { flags } from '@inject';
import { type RetransmitInfo } from 'src/middleware/retransmit/state';
import { getSender } from 'src/sender';
import type { SenderInfo } from 'src/sender/SenderInfo';
import { browserInfo } from 'src/utils/browserInfo/browserInfo';
import type { CounterOptions } from 'src/utils/counterOptions';
import { getCounterSettings } from 'src/utils/counterSettings/counterSettings';
import { errorLogger } from 'src/utils/errorLogger/errorLogger';
import { bindArgs } from 'src/utils/function/bind/bind';
import { telemetry } from 'src/utils/telemetry/telemetry';
import type { ProviderResultPromised } from 'src/types';
import { runAsync } from 'src/utils/async/async';
import { ASYNC_PROVIDERS_MAX_EXEC_TIME } from 'src/const';
import { iterateTaskWithConstraints } from 'src/utils/async/helpers';
import { noop } from 'src/utils/function/noop';
import { RETRANSMIT_PROVIDER } from './const';

/**
 * Retransmits previously failed requests using the provided context and counter options.
 *
 * @param ctx - The window context used for error logging and sender initialization.
 * @param counterOpt - The counter options used to configure the retransmission sender.
 * @param requests - An array of retransmission request information to be processed.
 * @returns A promise that resolves when all retransmission requests have been processed.
 */
export const sendRetransmitRequests = (
    ctx: Window,
    counterOpt: CounterOptions,
    requests: RetransmitInfo[],
): ProviderResultPromised => {
    const errorCatcher = errorLogger(ctx, 'rts.p') as () => void;
    const retransmitSender = getSender(ctx, RETRANSMIT_PROVIDER, counterOpt);
    const makeRetransmit = (req: RetransmitInfo) => {
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

        if (flags.TELEMETRY_FEATURE && req.telemetry) {
            senderInfo.telemetry = telemetry(req.telemetry);
        }

        return retransmitSender(senderInfo, counterOptions).then(
            noop,
            errorCatcher,
        );
    };

    return getCounterSettings(counterOpt, () => {
        runAsync(
            ctx,
            bindArgs(
                [
                    ctx,
                    requests,
                    makeRetransmit,
                    ASYNC_PROVIDERS_MAX_EXEC_TIME,
                    'rts.a',
                ],
                iterateTaskWithConstraints<RetransmitInfo>,
            ),
        );
    }).then(noop, errorCatcher);
};
