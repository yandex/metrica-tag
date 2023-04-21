import { cIndexOfWin } from 'src/utils/array/indexOf';
import { firstArg } from './identity';
import { argsToArray } from './args';
import { AnyFunc } from './types';

/**
 * Creates a memoized function.
 *
 * @param fn A function to memoize
 * @param rawKeyFn A function that determines the cache key
 * for storing the result based on the arguments provided to the function.
 * Defaults to the first argument.
 * The function is invoked only if no previous result is found for the key.
 */
export const memo = <FN extends AnyFunc, K = Parameters<FN>[0]>(
    fn: FN,
    rawKeyFn?: (...arg: Parameters<FN>) => K,
): FN => {
    let keyFn: (...arg: Parameters<FN>) => K;
    const resStorage: ReturnType<FN>[] = [];
    const keyStorage: K[] = [];
    if (!rawKeyFn) {
        // @ts-expect-error
        keyFn = firstArg;
    } else {
        keyFn = rawKeyFn;
    }
    // @ts-expect-error
    return function memoized() {
        // eslint-disable-next-line prefer-rest-params
        const fnArgs = argsToArray(arguments) as Parameters<FN>;
        const key = keyFn(...fnArgs);
        const keyIndex = cIndexOfWin(key, keyStorage);
        if (keyIndex !== -1) {
            return resStorage[keyIndex];
        }
        const fnRes: ReturnType<FN> = fn(...fnArgs);
        resStorage.push(fnRes);
        keyStorage.push(key);
        return fnRes;
    };
};
