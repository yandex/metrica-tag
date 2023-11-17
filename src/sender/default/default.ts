import { DEBUG_EVENTS_FEATURE } from 'generated/features';
import { flags } from '@inject';
import type { InternalSenderInfo } from 'src/sender/SenderInfo';
import type { TransportList } from 'src/transport';
import type {
    InternalTransportOptions,
    TransportResponse,
} from 'src/transport/types';
import { mix } from 'src/utils/object';
import { bodyToQuery } from 'src/utils/querystring';
import { throwFunction } from 'src/utils/errorLogger/throwFunction';
import {
    debugLogRequest,
    logRequestFailure,
    logRequestSuccess,
} from 'src/providers/debugEvents/debugRequest';
import { CONTENT_TYPE_HEADER } from './const';
import { createQuery } from './query';

declare module 'src/sender/SenderInfo' {
    interface PrivateSenderInfo {
        /**
         * Choose URL path that guarantees no redirects.
         * Useful for POST requests for which a redirect causes loss of data in body.
         */
        noRedirect?: boolean;
    }
}

export type DefaultSenderResult = {
    responseData: TransportResponse;
    urlIndex: number;
};

const iterateTransports = (
    ctx: Window,
    transports: TransportList,
    urls: string[],
    senderInfo: InternalSenderInfo,
    urlIndex = 0,
    transportIndex = 0,
): Promise<DefaultSenderResult> => {
    const opt: InternalTransportOptions = mix(
        { debugStack: [] },
        senderInfo.transportInfo,
    );
    const [id, transport] = transports[transportIndex];

    const url = urls[urlIndex];
    if ((!opt.rHeaders || !opt.rHeaders[CONTENT_TYPE_HEADER]) && opt.rBody) {
        opt.rHeaders = mix({}, opt.rHeaders, {
            [CONTENT_TYPE_HEADER]: 'application/x-www-form-urlencoded',
        });
        opt.rBody = bodyToQuery(opt.rBody as string);
    }

    opt.verb = opt.rBody ? 'POST' : 'GET';
    opt.rQuery = createQuery(ctx, senderInfo, id);
    opt.resource = (senderInfo.urlInfo || {}).resource;
    opt.debugStack.push(id);
    mix(senderInfo.transportInfo, opt);
    const noRedirect =
        senderInfo.privateSenderInfo && senderInfo.privateSenderInfo.noRedirect;
    const fullUrl = `${url}${noRedirect ? '/1' : ''}`;

    let requestId = 0;
    if (flags[DEBUG_EVENTS_FEATURE]) {
        requestId = debugLogRequest(ctx, fullUrl, opt);
    }
    return transport(fullUrl, opt)
        .then((responseData) => {
            if (flags[DEBUG_EVENTS_FEATURE]) {
                logRequestSuccess(ctx, requestId, responseData);
            }
            return { responseData, urlIndex };
        })
        .catch((exception) => {
            if (flags[DEBUG_EVENTS_FEATURE]) {
                logRequestFailure(ctx, requestId, exception);
            }
            const lastTransport = transportIndex + 1 >= transports.length;
            const lastUrl = urlIndex + 1 >= urls.length;

            if (lastTransport && lastUrl) {
                throwFunction(exception);
            }

            const nextTransportIndex = !lastTransport ? transportIndex + 1 : 0;
            const nextUrlIndex =
                !lastUrl && lastTransport ? urlIndex + 1 : urlIndex;

            return iterateTransports(
                ctx,
                transports,
                urls,
                senderInfo,
                nextUrlIndex,
                nextTransportIndex,
            );
        });
};

export const useDefaultSender =
    (ctx: Window, transports: TransportList) =>
    (
        senderInfo: InternalSenderInfo,
        urls: string[],
    ): Promise<DefaultSenderResult> =>
        iterateTransports(ctx, transports, urls, senderInfo);

export type SenderFn = ReturnType<typeof useDefaultSender>;
export type SenderParams = Parameters<SenderFn>;
