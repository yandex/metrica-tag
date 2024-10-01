import { isNumber } from 'src/utils/number/number';
import {
    removeByRegexp,
    removeNonDigits,
    trimText,
} from 'src/utils/string/remove';
import {
    MAX_TEL_LENGTH,
    MIN_TEL_LENGTH,
    PHONE_MAX_VALID_DIGIT_CNT,
    PHONE_MIN_VALID_DIGIT_CNT,
} from './const';

const trimNonPhoneSymbols = removeByRegexp(/[^\d+()]/g);
const hasLettersRegex = /[a-zа-яё,.]/gi;

/**
 * Validates and normalizes a phone number.
 * For invalid input returns undefined.
 *
 * @param {Pick<Window, 'isFinite' | 'isNaN'>} ctx global object that provides isFinite and isNan functions.
 * @param {string} origPhone - phone number
 * @returns {string | undefined}
 */
export const processPhoneNumber = (
    ctx: Window,
    origPhone: string,
): string | undefined => {
    const digits = removeNonDigits(origPhone);
    const digitsCount = digits.length;
    if (
        hasLettersRegex.test(origPhone) ||
        origPhone.length - digitsCount > digitsCount || // Число цифровых символов должно быть не меньше чем число вспомогательных.
        digitsCount < MIN_TEL_LENGTH ||
        digitsCount > MAX_TEL_LENGTH
    ) {
        return undefined;
    }

    const firstLetter = origPhone[0];
    const firstDigit = digits[0];
    const secondLetter = origPhone[1];
    if (firstLetter === '+' && secondLetter !== firstDigit) {
        return undefined;
    }

    const phone = trimNonPhoneSymbols(origPhone);

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
