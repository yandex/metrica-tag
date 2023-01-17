import { cForEach, cMap, head } from 'src/utils/array';
import {
    MiddlewareGetter,
    Middleware,
    MiddlewareWeightTuple,
} from 'src/middleware/types';
import { prerender } from 'src/middleware/prerender';
import {
    ProvidersMap,
    HIT_PROVIDER,
    Provider,
    RETRANSMIT_PROVIDER,
    LOGGER_PROVIDER,
} from 'src/providers';
import { watchSyncFlags } from 'src/middleware/watchSyncFlags';
import { CounterOptions } from 'src/utils/counterOptions';
import { pageTitle } from 'src/middleware/pageTitle';
import { counterFirstHit } from 'src/middleware/counterFirstHit';
import {
    retransmit,
    retransmitProviderMiddleware,
} from 'src/middleware/retransmit';
import { pipe, call, bindArg } from 'src/utils/function';
import { ctxBindArgs } from 'src/utils/function/bind/ctxBind';
import { RETRANSMIT_FEATURE, PREPROD_FEATURE } from 'generated/features';
import { flags } from '@inject';
import { prepareUrlMiddleware } from './prepareUrl';
import { addMiddlewareFor, addMiddlewareToTheList } from './utils';

// Использовать в случае, если запросы идут не в ручку watch
// const defaultFlagsWithoutTelemetry = watchSyncFlags(DEFAULT_BRINFO_FLAGS)

export const commonMiddlewares: MiddlewareWeightTuple[] = [
    [prerender, 1],
    [counterFirstHit, 2],
    [watchSyncFlags(), 3],
    [pageTitle, 4],
];

/**
 * This is list of middlewares that are always executed irrespectively of the provider
 * @constant
 * @type MiddlewareGetter
 */
export const universalMiddlewares: MiddlewareGetter[] = [];

export const addCommonMiddleware = bindArg(
    commonMiddlewares,
    addMiddlewareToTheList,
);

/*
    Нужно стараться держать retransmit последним в списке
    commonMiddlewares что бы он захватывал все выставленные до него
    флаги в browserInfo
*/
if (flags[RETRANSMIT_FEATURE]) {
    addCommonMiddleware(retransmit, 100);
}

export const providerMiddlewareList: ProvidersMap<MiddlewareWeightTuple[]> = {
    [HIT_PROVIDER]: commonMiddlewares,
};

export const addMiddlewareForProvider: (
    providerName: Provider,
    middleware?: MiddlewareGetter,
    weight?: number,
) => void = bindArg(providerMiddlewareList, addMiddlewareFor);

if (flags[PREPROD_FEATURE]) {
    addMiddlewareForProvider(LOGGER_PROVIDER);
}

// This should be always first
// And it shouldn't get into the params middlewares list
addCommonMiddleware(prepareUrlMiddleware, -100);

if (flags[RETRANSMIT_FEATURE]) {
    addMiddlewareForProvider(RETRANSMIT_PROVIDER, counterFirstHit, 1);
    addMiddlewareForProvider(
        RETRANSMIT_PROVIDER,
        retransmitProviderMiddleware,
        2,
    );
}

/**
 * Gets middlewares of specified provider
 * @param ctx - Current window
 * @param provider - The provider whose middlewares will be returned
 * @param opt - Counter options on initialization
 */
export const getProviderMiddlewares = (
    ctx: Window,
    provider: Provider,
    opt: CounterOptions,
) => {
    const middlewareList =
        providerMiddlewareList[provider] || commonMiddlewares;
    const returnMiddlewares = cMap(head, middlewareList);
    cForEach(
        (middleware) => returnMiddlewares.unshift(middleware),
        universalMiddlewares,
    );
    return cMap(
        pipe(ctxBindArgs([ctx, opt]), call),
        returnMiddlewares,
    ) as any as Middleware[];
};
