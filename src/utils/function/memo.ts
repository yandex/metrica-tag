/* eslint-disable */
import { cIndexOfWin } from 'src/utils/array/indexOf';
import { firstArg } from './identity';
import { argsToArray } from './args';
import { AnyFunc } from './types';

export type MemoFn = <FN extends (...a: any) => any>(
    fn: FN,
    keyFn?: (...args: Parameters<FN>) => any,
) => FN;

/**
 * @type function(...?): ?
 *
 */
export const memo: MemoFn = <FN extends AnyFunc, K>(
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
    return function a() {
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
