import { getVersion } from '@inject';
import { getGlobalStorage } from 'src/storage/global';
import { getPath } from 'src/utils/object/path';
import { memo } from './memo';
import type { AnyFunc } from './types';

const MEMO_FN_KEY = `m${getVersion()}`;
const GLOBAL_MEMO_FN_KEY = 'global';
export const IS_RECOVERED_FN_KEY = 'r';
export const INTERSECT_PROVIDER_FN_KEY = 'i';

type Variadic = readonly any[];

export type ctxFunction<Args extends Variadic, Result> = (
    ctx: Window,
    ...a: Args
) => Result;

/**
 * Creates a globally memoized function. The function is written to global storage
 * and is accessible by all counters on the page.
 *
 * @param key The key on the global storage
 * @param fn Function to be memoized
 * @param global A flag indicating whether the function is written to global storage
 * into version-specific scope or onto the `global` key.
 * The former allows different versions of a counter to operate simultaneously
 * and have isolated function scope.
 * The latter defines the scope shared by all counters disregarding its version.
 * NOTE: Be cautious of the true global key as it allows different versions of the counter
 * to overwrite the function.
 */
export const globalMemoWin = <R, T extends Variadic = Variadic>(
    key: string,
    fn: (ctx: Window, ...a: T) => R,
    global?: boolean,
): ctxFunction<T, R> => {
    return function globalMemoWrapper() {
        // eslint-disable-next-line prefer-rest-params
        const ctx = arguments[0];

        const storage = getGlobalStorage(ctx);
        const gsKey = global ? GLOBAL_MEMO_FN_KEY : MEMO_FN_KEY;
        const memoStorage = storage.getVal<Record<string, AnyFunc>>(gsKey, {});

        let wrappedFunction = getPath(memoStorage, key);
        if (!wrappedFunction) {
            wrappedFunction = memo(fn);
            memoStorage[key] = wrappedFunction;
            storage.setVal(gsKey, memoStorage);
        }

        // eslint-disable-next-line prefer-rest-params
        // eslint-disable-next-line prefer-spread
        // @ts-expect-error -- argumentas object is not a pure Array, which is ok.
        return wrappedFunction.apply(null, arguments);
    };
};
