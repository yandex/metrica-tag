import { removeNonDigits } from 'src/utils/string/remove';
import { PHONE_MAX_VALID_DIGIT_CNT, PHONE_MIN_VALID_DIGIT_CNT } from './const';

const allowedCharactersRegex = /^[0-9()\-+\s]+$/;

/**
 * Validates and normalizes a phone number.
 * For invalid input returns undefined.
 *
 * @param {Pick<Window, 'isFinite' | 'isNaN'>} ctx global object that provides isFinite and isNan functions.
 * @param origPhone - phone number
 */
export const processPhoneNumber = (
    ctx: Window,
    origPhone: string,
): string | undefined => {
    const digits = removeNonDigits(origPhone);
    const digitsCount = digits.length;
    const firstLetter = origPhone[0];
    const firstDigit = digits[0];

    if (
        digitsCount < PHONE_MIN_VALID_DIGIT_CNT ||
        digitsCount > PHONE_MAX_VALID_DIGIT_CNT ||
        firstDigit === '0' || // Numbers starting with 0 are invalid
        !allowedCharactersRegex.test(origPhone)
    ) {
        return undefined;
    }

    // We assume that numbers that don't start with + are Russian by default
    if (digitsCount === 10 && firstLetter !== '+') {
        return `7${digits}`;
    }

    if (digitsCount === 11) {
        if (firstLetter === '+' && firstDigit === '8') {
            return undefined;
        }

        // If phone number starts with 8, we assume it's Russian
        if (firstDigit === '8') {
            return `7${digits.slice(1)}`;
        }
    }

    // Code with the +7 prefix is used only for RU and KZ phone numbers,
    // which in both cases have 11 digits length, so we consider any other longer numbers invalid
    if (digitsCount >= 12 && firstLetter === '+' && firstDigit === '7') {
        return undefined;
    }

    return digits;
};
