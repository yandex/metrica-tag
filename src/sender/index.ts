import { useSenderWatch } from 'src/sender/watch';
import { HIT_PROVIDER, LOGGER_PROVIDER, Provider } from 'src/providers';
import { getProviderMiddlewares } from 'src/middleware';
import { getTransportList } from 'src/transport';
import { PREPROD_FEATURE } from 'generated/features';
import { ctxErrorLogger } from 'src/utils/errorLogger';
import { CounterOptions } from 'src/utils/counterOptions';
import { mix } from 'src/utils/object';
import { argsToArray } from 'src/utils/function/args';
import { flags } from '@inject';
import { createKnownError } from 'src/utils/errorLogger/knownError';
import { bind, bindArg, firstArg, FirstArgOfType } from 'src/utils/function';
import { PolyPromise } from 'src/utils';
import { NameMap, AnySender, GetSenderType } from './types';
import { InternalSenderInfo, SenderInfo } from './SenderInfo';

const fallbackSender = bind(
    PolyPromise.reject,
    PolyPromise,
    createKnownError(),
);

export const providerMap: Partial<NameMap> = {
    [HIT_PROVIDER]: useSenderWatch,
};

if (flags[PREPROD_FEATURE]) {
    providerMap[LOGGER_PROVIDER] = bindArg(
        fallbackSender,
        firstArg as FirstArgOfType<() => Promise<unknown>>,
    );
}

type GetSender = <P extends Provider>(
    ctx: Window,
    provider: P,
    opt?: CounterOptions,
) => GetSenderType<P>;

export const getSender: GetSender = ctxErrorLogger(
    'g.sen',
    (ctx, provider, counterOpt) => {
        const transports = getTransportList(ctx, provider);
        const middleware = counterOpt
            ? getProviderMiddlewares(ctx, provider, counterOpt)
            : [];
        const sender = providerMap[provider];
        const senderFn = sender
            ? (sender(ctx, transports, middleware) as AnySender)
            : (useSenderWatch(ctx, transports, middleware) as AnySender);

        return function c() {
            // eslint-disable-next-line prefer-rest-params
            const [rawSenderOpt, ...rest] = argsToArray(arguments) as [
                SenderInfo,
                ...any[]
            ];
            const { transportInfo = {} } = rawSenderOpt;
            const senderOpt = mix(rawSenderOpt, {
                transportInfo: mix(transportInfo, { debugStack: [provider] }),
            } as InternalSenderInfo);
            return senderFn(senderOpt, ...rest);
        } as GetSenderType<typeof provider>;
    },
    /*
        В getTransportList происходит knownError (METR-38257).
        Результат getSender - функция, чтобы не проверять перед каждым вызовом на undefined,
        возвращается fallbackSender.
     */
    fallbackSender,
);
