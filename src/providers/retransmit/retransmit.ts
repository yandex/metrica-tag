import { CounterOptions } from 'src/utils/counterOptions';
import { getSender } from 'src/sender';
import { RETRANSMIT_PROVIDER } from 'src/providers';
import { errorLogger } from 'src/utils/errorLogger';
import {
    getRetransmitRequests,
    RetransmitInfo,
} from 'src/middleware/retransmit';
import { cReduce } from 'src/utils/array';
import { browserInfo } from 'src/utils/browserInfo';
import { getCounterSettings } from 'src/utils/counterSettings';
import { bind, bindArg, firstArg } from 'src/utils/function';
import { PolyPromise } from 'src/utils';

/**
 * If hit was not delivered, save it and try to transmit later
 * @param ctx - Current window
 * @param counterOpt - Counter options during initialization
 */
const useRetransmitProvider = (ctx: Window, counterOpt: CounterOptions) => {
    const retransmitRequests = getRetransmitRequests(ctx);
    const retransmitSender = getSender(ctx, RETRANSMIT_PROVIDER, counterOpt);
    const errorCatcher = errorLogger(ctx, 'rts.p');
    const makeRetransmit = (prev: Promise<string>, req: RetransmitInfo) => {
        const counterOptions: CounterOptions = {
            id: req.counterId,
            counterType: req.counterType,
        };

        const result = retransmitSender(
            {
                transportInfo: { rBody: req.postParams },
                brInfo: browserInfo(req.browserInfo),
                urlParams: req.params,
                middlewareInfo: {
                    retransmitIndex: req.retransmitIndex,
                },
                urlInfo: {
                    resource: req.resource,
                },
            },
            counterOptions,
        ).catch(errorCatcher);

        return prev.then(bindArg(result, firstArg));
    };

    return getCounterSettings(
        counterOpt,
        bind(
            cReduce,
            null,
            makeRetransmit,
            PolyPromise.resolve(),
            retransmitRequests,
        ),
    ).catch(errorCatcher) as Promise<void>;
};

export { useRetransmitProvider };
