import { PolyPromise } from 'src/utils';
import { SenderInfo } from 'src/sender/SenderInfo';
import { iterForOf, iterNextCall, iterBreak } from 'src/utils/async';
import { Middleware, MiddlewareHandler } from './types';

/**
 * Make promise that runs all middlewares before or after request
 * @param rawMiddlewareList - Array of middlewares
 * @param senderParams - Parameters to be passed to middleware
 * @param before - Run before request, if false runs after
 */
export const combineMiddlewares = (
    rawMiddlewareList: Middleware[],
    senderParams: SenderInfo,
    before = false,
): Promise<void> => {
    return new PolyPromise((resolve, reject) => {
        const resolveFn: MiddlewareHandler = (finalSenderParams, next) => {
            next();
            resolve();
        };
        const middlewareList = rawMiddlewareList.slice();
        middlewareList.push({
            beforeRequest: resolveFn,
            afterRequest: resolveFn,
        });
        const iterator = iterForOf(
            middlewareList,
            (middleware, next: () => void) => {
                const fn = before
                    ? middleware.beforeRequest
                    : middleware.afterRequest;
                if (fn) {
                    try {
                        fn(senderParams, next);
                    } catch (e) {
                        iterator(iterBreak);
                        reject(e);
                    }
                } else {
                    next();
                }
            },
        );
        iterator(iterNextCall);
    });
};
