import { getVersion } from 'src/version';
import { getGlobalStorage } from 'src/storage/global';
import { getPath } from 'src/utils/object/path';
import { argsToArray } from './args';
import { memo } from './memo';

const MEMO_FN_KEY = `m${getVersion()}`;
export const IS_RECOVERED_FN_KEY = 'r';
export const INTERSECT_PROVIDER_FN_KEY = 'i';

type Variadic = readonly any[];

export type ctxFunction<Args extends Variadic, Result> = (
    ctx: Window,
    ...a: Args
) => Result;

export const globalMemoWin = <R, T extends Variadic = Variadic>(
    key: string,
    fn: (ctx: Window, ...a: T) => R,
): ctxFunction<T, R> => {
    return function globalMemoWrapper() {
        // eslint-disable-next-line prefer-rest-params
        const [ctx, ...args] = argsToArray(arguments);

        const storage = getGlobalStorage(ctx);
        const memoStorage = storage.getVal<Record<string, Function>>(
            MEMO_FN_KEY,
            {},
        );

        let wrappedFunction = getPath(memoStorage, key);
        if (!wrappedFunction) {
            wrappedFunction = memo(fn);
            memoStorage[key] = wrappedFunction;
            storage.setVal(MEMO_FN_KEY, memoStorage);
        }

        return wrappedFunction(ctx, ...args);
    };
};
