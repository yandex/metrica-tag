import * as chai from 'chai';
import { config } from 'src/config';
import { createKnownError, throwKnownError, isKnownError } from '../knownError';
import { KNOWN_ERROR } from '../consts';

describe('known error', () => {
    const defaultMessage = `${KNOWN_ERROR}(${config.buildVersion})`;
    const genRandomMessage = () => {
        return Math.random().toString().slice(2);
    };
    const randomMessages = new Array(3).fill(undefined).map(genRandomMessage);

    it('should create an error with a valid message', () => {
        [
            {
                expcectedMessage: defaultMessage,
                param: undefined,
            },
            {
                expcectedMessage: defaultMessage + randomMessages[0],
                param: randomMessages[0],
            },
            {
                expcectedMessage:
                    defaultMessage +
                    [randomMessages[1], randomMessages[2]].join('.'),
                param: [randomMessages[1], randomMessages[2]],
            },
        ].forEach(({ expcectedMessage, param }) => {
            const { message } = createKnownError(param);
            chai.expect(message).to.eq(expcectedMessage);
        });
    });

    it('should throw error', () => {
        chai.expect(throwKnownError).to.throw(defaultMessage);
    });

    it('should correctly validate error message', () => {
        [
            {
                message: KNOWN_ERROR,
                isMessageKnownError: true,
            },
            {
                message: defaultMessage,
                isMessageKnownError: true,
            },
            {
                message: ` ${KNOWN_ERROR}`,
                isMessageKnownError: false,
            },
            {
                message: `${KNOWN_ERROR}sdfsdfds`,
                isMessageKnownError: true,
            },
        ].forEach(({ message, isMessageKnownError }) => {
            chai.expect(
                isKnownError(message),
                `wrong result for message ${message}`,
            ).to.eq(isMessageKnownError);
        });
    });
});
