import { host as defaultHost } from 'src/config';
import { combineMiddlewares } from 'src/middleware/combine';
import type { Middleware } from 'src/middleware/types';
import { useDefaultSender } from 'src/sender/default';
import type { InternalSenderInfo, UrlInfo } from 'src/sender/SenderInfo';
import type { TransportList } from 'src/transport';
import type { TransportResponse } from 'src/transport/types';
import { arrayMerge } from 'src/utils/array/merge';
import type { CounterOptions } from 'src/utils/counterOptions';
import { bindArg } from 'src/utils/function/bind';
import { getSenderMiddlewares } from 'src/middleware/senderMiddlewares';
import { Sender } from 'src/sender/types';
import { FirstArgOfType, firstArg } from 'src/utils/function/identity';
import { cMap } from 'src/utils/array/map';
import { returnFullHost } from './returnFullHost';

export const useMiddlewareSender = (
    ctx: Window,
    transports: TransportList,
    middlewareList: Middleware[],
) => {
    const sender = useDefaultSender(ctx, transports);

    return (senderInfo: InternalSenderInfo) =>
        combineMiddlewares(middlewareList, senderInfo, true)
            .then(() => {
                const {
                    hostPrefix = '',
                    resource = '',
                    hosts = [defaultHost],
                } = senderInfo.urlInfo || ({} as UrlInfo);

                const urls = cMap(
                    (host) => returnFullHost(resource, `${hostPrefix}${host}`),
                    hosts,
                );

                return sender(senderInfo, urls);
            })
            .then(({ responseData, urlIndex }) => {
                senderInfo.responseInfo = responseData;
                senderInfo.responseUrlIndex = urlIndex;

                return combineMiddlewares(middlewareList, senderInfo).then(
                    bindArg(
                        responseData,
                        firstArg as FirstArgOfType<TransportResponse>,
                    ),
                );
            });
};

export type MiddlewareBasedSender = (
    ctx: Window,
    transports: TransportList,
    middlewareList: Middleware[],
) => (
    senderParams: InternalSenderInfo,
    counterOptions: CounterOptions,
) => ReturnType<ReturnType<typeof useMiddlewareSender>>;

export const useMiddlewareBasedSender =
    (senderType: Sender): MiddlewareBasedSender =>
    (ctx: Window, transports: TransportList, middlewareList: Middleware[]) =>
    (rawSenderParams: InternalSenderInfo, counterOpt: CounterOptions) => {
        const middlewares = arrayMerge(
            getSenderMiddlewares(ctx, senderType, counterOpt),
            middlewareList,
        );
        const sender = useMiddlewareSender(ctx, transports, middlewares);
        return sender(rawSenderParams);
    };
