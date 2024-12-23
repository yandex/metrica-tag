import { isArray } from 'src/utils/array/isArray';
import { cForEach, cMap } from 'src/utils/array/map';
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
import { pipe } from 'src/utils/function/pipe';
import { call } from 'src/utils/function/utils';
import { ctxBindArgs } from 'src/utils/function/bind/ctxBind';
import { bindArg } from 'src/utils/function/bind/bind';
import { head } from 'src/utils/array/utils';
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
export const providerMiddlewareList: Partial<
    ProvidersMap<MiddlewareWeightTuple[]>
> = {
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
 * @param providerOrMiddlewares - The provider whose middlewares will be returned, or middlewares list to be to be supplemented with universal middlewares
 * @param opt - Counter options on initialization
 */
export const getProviderMiddlewares = (
    ctx: Window,
    providerOrMiddlewares: Provider | MiddlewareWeightTuple[],
    opt: CounterOptions,
) => {
    const middlewareList = isArray(providerOrMiddlewares)
        ? providerOrMiddlewares
        : providerMiddlewareList[providerOrMiddlewares] || commonMiddlewares;
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
