import {
    INTERNAL_PARAMS_KEY,
    METHOD_NAME_PARAMS,
} from 'src/providers/params/const';
import { PolyPromise } from 'src/utils/promise';
import { includes } from 'src/utils/array/includes';
import { cReduce } from 'src/utils/array/reduce';
import { getCounterInstance } from 'src/utils/counter/getInstance';
import { CounterOptions, getCounterKey } from 'src/utils/counterOptions';
import { ctxErrorLogger, errorLogger } from 'src/utils/errorLogger/errorLogger';
import { createKnownError } from 'src/utils/errorLogger/knownError';
import { memo } from 'src/utils/function/memo';
import { isHttps } from 'src/utils/location/location';
import { cKeys, entries, getPath, isObject } from 'src/utils/object';
import { isString, stringIndexOf } from 'src/utils/string';
import { isNumber } from 'src/utils/number/number';
import { createError } from 'src/utils/errorLogger/createError';
import { noop } from 'src/utils/function/noop';
import { consoleLog } from '../debugConsole/debugConsole';
import { FIRST_PARTY_PARAMS_KEY } from './const';
import type {
    FirstPartyInputData,
    FirstPartyOutputData,
    FirstPartyMethodHandler,
} from './types';
import { METHOD_NOT_SUPPORTED_CONSOLE_MESSAGE } from '../consoleRenderer/dictionary';
import { processEmail, processPhoneNumber } from './process';

export const isEncoderSupported = memo<(ctx: Window) => boolean>((ctx) => {
    return (
        !!getPath(ctx, 'crypto.subtle.digest') &&
        !!getPath(ctx, 'TextEncoder') &&
        !!getPath(ctx, 'FileReader') &&
        !!getPath(ctx, 'Blob')
    );
});

export const hashVal = (ctx: Window, val: string) => {
    return new PolyPromise<string>((resolve, reject) => {
        const textBytes = new ctx.TextEncoder().encode(val);
        const hashPromise = ctx.crypto.subtle.digest('SHA-256', textBytes);
        hashPromise.then((buffer) => {
            const blob = new ctx.Blob([buffer], {
                type: 'application/octet-binary',
            });
            const fileReader = new ctx.FileReader();
            fileReader.onload = (fileReaderEvent) => {
                const result = getPath(fileReaderEvent, 'target.result') || '';
                const commaIndex = stringIndexOf(result, ',');
                if (commaIndex !== -1) {
                    resolve(result.substring(commaIndex + 1));
                } else {
                    reject(createError('fpm.i'));
                }
            };
            fileReader.readAsDataURL(blob);
        }, reject);
    });
};

const NON_HASHABLE_KEYS: string[] = ['yandex_cid', 'yandex_public_id'];
export const encodeRecursive = (
    ctx: Window,
    obj: FirstPartyInputData,
    level = 0,
): Promise<FirstPartyOutputData[]> => {
    const entry = entries(obj);
    const promiseList = cReduce<
        [string, string | number | FirstPartyInputData],
        Promise<FirstPartyOutputData>[]
    >(
        (accum, [key, originalValue]) => {
            let val = originalValue;
            const valIsObject = isObject(val);

            if (!valIsObject) {
                if (isNumber(ctx, val)) {
                    val = `${val}`;
                }
                if (!isString(val)) {
                    return accum;
                }
            }

            let resultPromise: Promise<string | FirstPartyOutputData[]>;
            if (valIsObject) {
                resultPromise = encodeRecursive(
                    ctx,
                    val as FirstPartyInputData,
                    level + 1,
                );
            } else if (!level && includes(key, NON_HASHABLE_KEYS)) {
                // METR-48665, METR-59109
                resultPromise = PolyPromise.resolve(val as string);
            } else {
                let value: string | undefined = val as string;
                if (key === 'phone_number') {
                    value = processPhoneNumber(ctx, value);
                } else if (key === 'email') {
                    value = processEmail(value);
                }
                if (!value) {
                    return accum;
                }
                resultPromise = hashVal(ctx, value);
            }
            accum.push(resultPromise.then((encodedVal) => [key, encodedVal]));
            return accum;
        },
        [],
        entry,
    );
    return PolyPromise.all(promiseList);
};

export const rawFirstPartyMethod = (
    ctx: Window,
    counterOptions: CounterOptions,
): FirstPartyMethodHandler => {
    if (!isHttps(ctx)) {
        return noop;
    }
    const counterKey = getCounterKey(counterOptions);
    if (!isEncoderSupported(ctx)) {
        consoleLog(ctx, counterKey, METHOD_NOT_SUPPORTED_CONSOLE_MESSAGE);
        return noop;
    }
    const counter = getCounterInstance(ctx, counterOptions);
    if (!counter) {
        return noop;
    }
    return (data: FirstPartyInputData) => {
        return new PolyPromise((resolve, reject) => {
            if (!isObject(data)) {
                return reject(createKnownError('fpm.o'));
            }
            if (!cKeys(data).length) {
                return reject(createKnownError('fpm.l'));
            }
            return resolve(
                encodeRecursive(ctx, data).then((result) => {
                    if (!result || !result.length) {
                        return;
                    }
                    counter[METHOD_NAME_PARAMS]!({
                        [INTERNAL_PARAMS_KEY]: {
                            [FIRST_PARTY_PARAMS_KEY]: result,
                        },
                    });
                }, noop),
            );
        }).catch(errorLogger(ctx, 'fpm.en'));
    };
};

/**
 * Sends contact information of site users in hashed and depersonalized form
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 */
export const useFirstPartyMethod = ctxErrorLogger('fpm', rawFirstPartyMethod);
