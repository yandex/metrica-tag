import { cForEach, cMap, head } from 'src/utils/array';
import {
    MiddlewareGetter,
    Middleware,
    MiddlewareWeightTuple,
} from 'src/middleware/types';
import { prerender } from 'src/middleware/prerender';
import { ProvidersMap, HIT_PROVIDER, Provider } from 'src/providers';
import { watchSyncFlags } from 'src/middleware/watchSyncFlags';
import { CounterOptions } from 'src/utils/counterOptions';
import { pageTitle } from 'src/middleware/pageTitle';
import { counterFirstHit } from 'src/middleware/counterFirstHit';
import { pipe, call, bindArg } from 'src/utils/function';
import { ctxBindArgs } from 'src/utils/function/bind/ctxBind';
import { prepareUrlMiddleware } from './prepareUrl';
import { addMiddlewareFor, addMiddlewareToTheList } from './utils';

export const commonMiddlewares: MiddlewareWeightTuple[] = [
    [prerender, 1],
    [counterFirstHit, 2],
    [watchSyncFlags(), 3],
    [pageTitle, 4],
];

/**
 * This is a list of middlewares that are always executed irrespectively of the provider
 * @constant
 */
export const universalMiddlewares: MiddlewareGetter[] = [];

export const addCommonMiddleware = bindArg(
    commonMiddlewares,
    addMiddlewareToTheList,
);

/**
 * A mapping between providers and corresponding middleware chains.
 */
export const providerMiddlewareList: ProvidersMap<MiddlewareWeightTuple[]> = {
    [HIT_PROVIDER]: commonMiddlewares,
};

export const addMiddlewareForProvider: (
    providerName: Provider,
    middleware?: MiddlewareGetter,
    weight?: number,
) => void = bindArg(providerMiddlewareList, addMiddlewareFor);

// This should be always first
// And it shouldn't get into the params middlewares list
addCommonMiddleware(prepareUrlMiddleware, -100);

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
