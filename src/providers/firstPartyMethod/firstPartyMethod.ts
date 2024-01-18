import {
    INTERNAL_PARAMS_KEY,
    METHOD_NAME_PARAMS,
} from 'src/providers/params/const';
import { PolyPromise } from 'src/utils';
import { cReduce } from 'src/utils/array';
import { getCounterInstance } from 'src/utils/counter';
import { CounterOptions, getCounterKey } from 'src/utils/counterOptions';
import {
    createError,
    ctxErrorLogger,
    errorLogger,
} from 'src/utils/errorLogger';
import { createKnownError } from 'src/utils/errorLogger/knownError';
import { memo, noop } from 'src/utils/function';
import {
    isHttps,
    isYandexSearchDomain,
    YANDEX_RU_DOMAIN,
} from 'src/utils/location';
import { cKeys, entries, getPath, isObject } from 'src/utils/object';
import { removeNonDigits, trimText } from 'src/utils/string/remove';
import { DOT_REGEX_GLOBAL, isString, stringIndexOf } from 'src/utils/string';
import { consoleLog } from '../debugConsole/debugConsole';
import {
    FirstPartyInputData,
    FirstPartyOutputData,
    FirstPartyMethodHandler,
    GOOGLEMAIL_DOMAIN,
    GMAIL_DOMAIN,
    FIRST_PARTY_PARAMS_KEY,
} from './const';

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

export const processPhoneNumber = (phone: string): string => {
    const digits = removeNonDigits(phone);
    return digits[0] === '8' ? `7${digits.slice(1)}` : digits;
};

export const processEmail = (email: string): string => {
    let [name, domain] = trimText(email).toLowerCase().split('@');

    if (!domain) {
        return email;
    }

    domain = domain.replace(GOOGLEMAIL_DOMAIN, GMAIL_DOMAIN);
    if (isYandexSearchDomain(domain)) {
        domain = YANDEX_RU_DOMAIN;
    }

    if (domain === YANDEX_RU_DOMAIN) {
        // Замена точек в части имени пользователя на дефисы, для яндексовых адресов.
        name = name.replace(DOT_REGEX_GLOBAL, '-');
    } else if (domain === GMAIL_DOMAIN) {
        // Удаление точек для @gmail.
        name = name.replace(DOT_REGEX_GLOBAL, '');
    }

    // Удаление хвоста в имени пользователя после плюса username+suffix@example.com --> username@example.com
    const indexOfPlusSign = stringIndexOf(name, '+');
    if (indexOfPlusSign !== -1) {
        name = name.slice(0, indexOfPlusSign);
    }

    return `${name}@${domain}`;
};

export const encodeRecursive = (
    ctx: Window,
    obj: FirstPartyInputData,
    level = 0,
): Promise<FirstPartyOutputData[]> => {
    const entry = entries(obj);
    const promiseList = cReduce<
        [string, string | FirstPartyInputData],
        Promise<FirstPartyOutputData>[]
    >(
        (accum, [key, val]) => {
            const valIsObject = isObject(val);
            if (!isString(val) && !valIsObject) {
                return accum;
            }

            let resultPromise: Promise<string | FirstPartyOutputData[]>;
            if (valIsObject) {
                resultPromise = encodeRecursive(
                    ctx,
                    val as FirstPartyInputData,
                    level + 1,
                );
            } else if (!level && key === 'yandex_cid') {
                // METR-48665
                resultPromise = PolyPromise.resolve(val as string);
            } else {
                let value = val as string;
                if (key === 'phone_number') {
                    value = processPhoneNumber(value);
                } else if (key === 'email') {
                    value = processEmail(value);
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
        consoleLog(ctx, counterKey, 'Not supported');
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
