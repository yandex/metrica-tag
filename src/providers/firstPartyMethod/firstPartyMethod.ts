import {
    INTERNAL_PARAMS_KEY,
    METHOD_NAME_PARAMS,
} from 'src/providers/params/const';
import { PolyPromise } from 'src/utils';
import { cReduce, cEvery } from 'src/utils/array';
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
import {
    removeNonDigits,
    trimText,
    removeByRegexp,
} from 'src/utils/string/remove';
import { DOT_REGEX_GLOBAL, isString, stringIndexOf } from 'src/utils/string';
import { isNumber } from 'src/utils/number';
import { consoleLog } from '../debugConsole/debugConsole';
import {
    FirstPartyInputData,
    FirstPartyOutputData,
    FirstPartyMethodHandler,
    GOOGLEMAIL_DOMAIN,
    GMAIL_DOMAIN,
    EMAIL_LOCAL_PART_REGEX,
    FIRST_PARTY_PARAMS_KEY,
    PHONE_MIN_VALID_DIGIT_CNT,
    PHONE_MAX_VALID_DIGIT_CNT,
} from './const';
import { METHOD_NOT_SUPPORTED_CONSOLE_MESSAGE } from '../consoleRenderer/dictionary';

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

export const trimNonPhoneSymbols = removeByRegexp(/[^\d+()]/g);
export const processPhoneNumber = (ctx: Window, origPhone: string): string => {
    const phone = trimNonPhoneSymbols(origPhone);
    const digits = removeNonDigits(origPhone);

    if (
        digits.length < PHONE_MIN_VALID_DIGIT_CNT ||
        digits.length > PHONE_MAX_VALID_DIGIT_CNT ||
        phone.startsWith('+8')
    ) {
        return trimText(origPhone);
    }
    if (phone[0] === '8') {
        return `7${digits.slice(1)}`;
    }
    if (phone[0] !== '+' && !isNumber(ctx, +phone[0])) {
        return `7${digits}`;
    }
    return digits;
};

/**
 *  Quoted-string  = DQUOTE *QcontentSMTP DQUOTE
 *
 *  QcontentSMTP   = qtextSMTP / quoted-pairSMTP
 *
 *  quoted-pairSMTP  = %d92 %d32-126
 *                   ; i.e., backslash followed by any ASCII
 *                   ; graphic (including itself) or SPace
 *
 *  qtextSMTP      = %d32-33 / %d35-91 / %d93-126
 *                 ; i.e., within a quoted string, any
 *                 ; ASCII graphic or space is permitted
 *                 ; without blackslash-quoting except
 *                 ; double-quote and the backslash itself.
 *
 *  String         = Atom / Quoted-string
 */
export const validateLocalQuoted = (part: string): boolean => {
    for (let i = 1; i + 2 < part.length; i += 1) {
        const charCode = part.charCodeAt(i);
        // %d32-33 / %d35-91 / %d93-126
        // [32 .. 126] wo 34, 92
        if (charCode < 32 || charCode === 34 || charCode > 126) {
            return false;
        }
        if (charCode === 92) {
            if (i + 2 === part.length) {
                return false;
            }
            // %d32-126
            if (part.charCodeAt(i + 1) < 32) {
                return false;
            }
            i += 1;
        }
    }
    return true;
};

export const validateLocalPart = (local: string): boolean => {
    // https://www.rfc-editor.org/rfc/rfc5321#section-4.1.2
    const MIN_LOCAL_PART_SIZE = 1;
    const MAX_LOCAL_PART_SIZE = 64;

    if (
        local.length < MIN_LOCAL_PART_SIZE ||
        local.length > MAX_LOCAL_PART_SIZE
    ) {
        return false;
    }

    return cEvery((part: string) => {
        if (part.length < MIN_LOCAL_PART_SIZE) {
            return false;
        }
        if (
            part[0] === '"' &&
            part[part.length - 1] === '"' &&
            part.length > 2
        ) {
            return validateLocalQuoted(part);
        }
        if (!EMAIL_LOCAL_PART_REGEX.test(part)) {
            return false;
        }
        return true;
    }, local.split('.'));
};

/**
 * https://www.rfc-editor.org/rfc/rfc5321#section-4.1.2
 */
export const validateEmail = (local: string, domain: string): boolean => {
    if (!domain) {
        return false;
    }
    return validateLocalPart(local);
};

export const processEmail = (origEmail: string): string => {
    const email = trimText(origEmail).replace(/^\++/gm, '').toLowerCase();
    const atIndex = email.lastIndexOf('@');
    if (atIndex === -1) {
        return email;
    }
    let local = email.substr(0, atIndex);
    let domain = email.substr(atIndex + 1);

    if (!validateEmail(local, domain)) {
        return email;
    }

    domain = domain.replace(GOOGLEMAIL_DOMAIN, GMAIL_DOMAIN);
    if (isYandexSearchDomain(domain)) {
        domain = YANDEX_RU_DOMAIN;
    }

    if (domain === YANDEX_RU_DOMAIN) {
        // Замена точек в части имени пользователя на дефисы, для яндексовых адресов.
        local = local.replace(DOT_REGEX_GLOBAL, '-');
    } else if (domain === GMAIL_DOMAIN) {
        // Удаление точек для @gmail.
        local = local.replace(DOT_REGEX_GLOBAL, '');
    }

    // Удаление хвоста в имени пользователя после плюса username+suffix@example.com --> username@example.com
    const indexOfPlusSign = stringIndexOf(local, '+');
    if (indexOfPlusSign !== -1) {
        local = local.slice(0, indexOfPlusSign);
    }

    return `${local}@${domain}`;
};

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
            } else if (!level && key === 'yandex_cid') {
                // METR-48665
                resultPromise = PolyPromise.resolve(val as string);
            } else {
                let value = val as string;
                if (key === 'phone_number') {
                    value = processPhoneNumber(ctx, value);
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
