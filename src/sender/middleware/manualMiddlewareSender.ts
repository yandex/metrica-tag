import { getProviderMiddlewares } from 'src/middleware';
import { MiddlewareWeightTuple } from 'src/middleware/types';
import { Provider } from 'src/providers/index';
import { getTransportList } from 'src/transport';
import { TransportId } from 'src/transport/transportsMap';
import { CounterOptions } from 'src/utils/counterOptions';
import { InternalSenderInfo, SenderInfo } from 'src/sender/SenderInfo';
import { mix } from 'src/utils/object';
import { useMiddlewareSender } from './middleware';

export const useManualMiddlewareSender = (
    ctx: Window,
    counterOpt: CounterOptions,
    provider: Provider,
    transportIds?: TransportId[],
    middlewareList?: MiddlewareWeightTuple[],
) => {
    const transports = getTransportList(ctx, provider, transportIds);
    const middlewares = getProviderMiddlewares(
        ctx,
        middlewareList || provider,
        counterOpt,
    );

    const sender = useMiddlewareSender(ctx, transports, middlewares);

    return (senderInfo: SenderInfo) => {
        const debugStack: (string | number)[] = [`mms.${provider}`];
        const internalSenderInfo: InternalSenderInfo = mix(
            {
                transportInfo: {
                    debugStack,
                },
            },
            senderInfo,
        );

        return sender(internalSenderInfo);
    };
};
