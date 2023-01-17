import { CLICKMAP_URL_PARAM } from 'src/api/clmap';
import { getSenderMiddlewares } from 'src/middleware/senderMiddlewares';
import { Middleware } from 'src/middleware/types';
import { InternalSenderInfo } from 'src/sender/SenderInfo';
import { TransportList } from 'src/transport';
import { arrayMerge } from 'src/utils/array';
import { CounterOptions } from 'src/utils/counterOptions';
import { errorLogger } from 'src/utils/errorLogger';
import { mix } from 'src/utils/object';
import { SENDER_CLICKMAP } from '../const';
import { useMiddlewareSender } from '../middleware';

export const CLICKMAP_RESOURCE = 'clmap';

export type SenderClickmap = (
    ctx: Window,
    transports: TransportList,
    middlewareList: Middleware[],
) => (
    senderParams: InternalSenderInfo,
    counterOptions: CounterOptions,
) => ReturnType<ReturnType<typeof useMiddlewareSender>>;

export const useSenderClickMap: SenderClickmap =
    (ctx: Window, transports: TransportList, middlewareList: Middleware[]) =>
    (senderParams: InternalSenderInfo, counterOptions: CounterOptions) => {
        // TODO: move this code into the sender middleware and unify all senders based on middlewareSender
        // -->
        const { urlParams } = senderParams;
        const clickMapUrlParams: Record<string, string> = {
            [CLICKMAP_URL_PARAM]:
                (urlParams && urlParams[CLICKMAP_URL_PARAM]) || '',
        };

        const defaultSenderParams = mix(senderParams, {
            urlParams: mix(senderParams.urlParams || {}, clickMapUrlParams),
            urlInfo: {
                resource: `${CLICKMAP_RESOURCE}/${counterOptions.id}`,
            },
        } as InternalSenderInfo);
        // <--

        const middlewares = arrayMerge(
            getSenderMiddlewares(ctx, SENDER_CLICKMAP, counterOptions),
            middlewareList,
        );

        const sender = useMiddlewareSender(ctx, transports, middlewares);
        return sender(defaultSenderParams).catch(errorLogger(ctx, 'c.m'));
    };
