import type { Middleware } from 'src/middleware/types';
import type { InternalSenderInfo } from 'src/sender/SenderInfo';
import type { TransportList } from 'src/transport';
import type { CounterOptions } from 'src/utils/counterOptions/types';
import { arrayMerge } from 'src/utils/array';
import { getSenderMiddlewares } from 'src/middleware/senderMiddlewares';
import { useMiddlewareSender } from '../middleware';
import { SENDER_WATCH } from '../const';

export type SenderWatch = (
    ctx: Window,
    transports: TransportList,
    middlewareList: Middleware[],
) => (
    rawSenderParams: InternalSenderInfo,
    counterOpt: CounterOptions,
) => ReturnType<ReturnType<typeof useMiddlewareSender>>;

export const useSenderWatch: SenderWatch =
    (ctx: Window, transports: TransportList, middlewareList: Middleware[]) =>
    (rawSenderParams: InternalSenderInfo, counterOpt: CounterOptions) => {
        const middlewares = arrayMerge(
            getSenderMiddlewares(ctx, SENDER_WATCH, counterOpt),
            middlewareList,
        );
        const sender = useMiddlewareSender(ctx, transports, middlewares);
        return sender(rawSenderParams);
    };
