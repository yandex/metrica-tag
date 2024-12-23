import { config } from 'src/config';
import { bindThisForMethodTest } from 'src/utils/function/bind';
import { isArray } from 'src/utils/array/isArray';
import { arrayJoin } from 'src/utils/array/join';
import { isString } from 'src/utils/string';
import { KNOWN_ERROR, DELIMITER } from './consts';
import { argsToArray } from '../function/args';
import { throwFunction } from './throwFunction';
import { createError } from './createError';

type Message = string | number;

export const createKnownError = (moreInfo?: Message | Message[]) => {
    let data: Message | Message[] = '';

    if (isArray(moreInfo)) {
        data = arrayJoin(DELIMITER, moreInfo);
    } else if (isString(moreInfo)) {
        data = moreInfo;
    }
    const errorMessage = `${KNOWN_ERROR}(${config.buildVersion})${data}`;

    return createError(errorMessage);
};

export const throwKnownError = function throwKnownError() {
    // eslint-disable-next-line prefer-rest-params
    const args = argsToArray(arguments);
    return throwFunction(createKnownError(args));
} as (...a: Parameters<typeof createKnownError>) => never;

export const isKnownError = bindThisForMethodTest(
    new RegExp(`^${KNOWN_ERROR}`),
);
