import { getGlobalStorage } from 'src/storage/global';
import { ctxErrorLogger, errorLogger } from 'src/utils/errorLogger';
import { CounterOptions, getCounterKey } from 'src/utils/counterOptions';
import { cForEach } from 'src/utils/array';
import type { AnyFunc } from 'src/utils/function/types';
import { isFunction } from 'src/utils/object';
import { DestructHandler } from './const';

type UnsubscribeCallbacks = (AnyFunc | undefined)[];

/**
 * Method for deinitializing provider of the counter, useful when changing the counter without refreshing the page
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 * @param unsubscribeMethods - Callbacks to be called
 */
export const destruct = ctxErrorLogger(
    'destruct.e',
    (
        ctx: Window,
        counterOptions: CounterOptions,
        unsubscribeMethods: UnsubscribeCallbacks,
    ): DestructHandler<void> => {
        return () => {
            const globalConfig = getGlobalStorage(ctx);
            const { id: counterId } = counterOptions;

            cForEach(
                (cb, index) =>
                    isFunction(cb) &&
                    errorLogger(ctx, `dest.fr.${index}`, cb)(),
                unsubscribeMethods,
            );
            delete globalConfig.getVal<{ [key: string]: unknown }>('counters')[
                getCounterKey(counterOptions)
            ];
            delete ctx[`yaCounter${counterId}` as any];
        };
    },
);
