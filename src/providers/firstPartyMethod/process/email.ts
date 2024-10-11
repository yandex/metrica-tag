import { cEvery } from 'src/utils/array/every';
import {
    isYandexSearchDomain,
    YANDEX_RU_DOMAIN,
} from 'src/utils/location/location';
import { trimText } from 'src/utils/string/remove';
import { DOT_REGEX_GLOBAL, stringIndexOf } from 'src/utils/string/string';
import {
    EMAIL_LOCAL_PART_REGEX,
    GMAIL_DOMAIN,
    GOOGLEMAIL_DOMAIN,
    MAX_EMAIL_LENGTH,
    MIN_EMAIL_LENGTH,
} from './const';

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
const validateLocalQuoted = (part: string): boolean => {
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

/**
 * @see https://www.rfc-editor.org/rfc/rfc5321#section-4.1.2
 */
const validateLocalPart = (local: string): boolean => {
    const MIN_LOCAL_PART_SIZE = 1;
    const MAX_LOCAL_PART_SIZE = 64;
    const localLength = local.length;

    if (
        localLength < MIN_LOCAL_PART_SIZE ||
        localLength > MAX_LOCAL_PART_SIZE
    ) {
        return false;
    }

    return cEvery((part: string) => {
        const partLength = part.length;
        if (partLength < MIN_LOCAL_PART_SIZE) {
            return false;
        }
        if (part[0] === '"' && part[partLength - 1] === '"' && partLength > 2) {
            return validateLocalQuoted(part);
        }
        if (!EMAIL_LOCAL_PART_REGEX.test(part)) {
            return false;
        }
        return true;
    }, local.split('.'));
};

/**
 * @see https://www.rfc-editor.org/rfc/rfc5321#section-4.1.2
 */
const validateEmail = (local: string, domain: string): boolean => {
    if (!domain) {
        return false;
    }
    return validateLocalPart(local);
};

const checkEmailLength = (email: string): string | undefined => {
    const emailLength = email.length;
    return emailLength < MIN_EMAIL_LENGTH || emailLength > MAX_EMAIL_LENGTH
        ? undefined
        : email;
};

/**
 * Validates and normalizes an email.
 * For invalid input returns undefined.
 *
 * @param origEmail email
 */
export const processEmail = (origEmail: string): string | undefined => {
    const email = trimText(origEmail).replace(/^\++/gm, '').toLowerCase();
    const atIndex = email.lastIndexOf('@');
    if (atIndex === -1) {
        return checkEmailLength(email);
    }
    let local = email.substr(0, atIndex);
    let domain = email.substr(atIndex + 1);

    if (!validateEmail(local, domain)) {
        return checkEmailLength(email);
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

    return checkEmailLength(`${local}@${domain}`);
};
