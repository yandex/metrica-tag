import { host as defaultHost } from 'src/config';
import { combineMiddlewares } from 'src/middleware/combine';
import type { Middleware } from 'src/middleware/types';
import { useDefaultSender } from 'src/sender/default';
import type { InternalSenderInfo, UrlInfo } from 'src/sender/SenderInfo';
import type { TransportList } from 'src/transport';
import type { TransportResponse } from 'src/transport/types';
import { cMap } from 'src/utils/array';
import { bindArg, firstArg, FirstArgOfType } from 'src/utils/function';
import { returnFullHost } from './returnFullHost';

export const useMiddlewareSender = (
    ctx: Window,
    transports: TransportList,
    middlewareList: Middleware[],
) => {
    const sender = useDefaultSender(ctx, transports);

    return (senderInfo: InternalSenderInfo) => {
        return combineMiddlewares(middlewareList, senderInfo, true)
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
};
