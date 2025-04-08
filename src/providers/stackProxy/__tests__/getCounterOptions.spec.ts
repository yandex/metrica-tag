import * as chai from 'chai';
import {
    DEFAULT_COUNTER_TYPE,
    RSYA_COUNTER_TYPE,
} from 'src/providers/counterOptions/const';
import { getCounterOptions } from '../stackProxy';

describe('getCounterOptions', () => {
    const testId = Math.floor(Math.random() * 100);

    describe('parses counter options from', () => {
        it('numeric id', () => {
            const options = getCounterOptions(testId);
            chai.expect(options).is.deep.eq({
                id: testId,
                counterType: DEFAULT_COUNTER_TYPE,
            });
        });

        it('string id', () => {
            const options = getCounterOptions(`${testId}`);
            chai.expect(options).is.deep.eq({
                id: testId,
                counterType: DEFAULT_COUNTER_TYPE,
            });
        });

        it('string counter key', () => {
            const options = getCounterOptions(`${testId}:${RSYA_COUNTER_TYPE}`);
            chai.expect(options).is.deep.eq({
                id: testId,
                counterType: RSYA_COUNTER_TYPE,
            });
        });

        it('string counter key with invalid type', () => {
            const options = getCounterOptions(`${testId}:abc`);
            chai.expect(options).is.deep.eq({
                id: testId,
                counterType: DEFAULT_COUNTER_TYPE,
            });
        });
    });

    describe('returns undefined for', () => {
        it('invalid id', () => {
            const options = getCounterOptions(Number.NaN);
            chai.expect(options).is.undefined;
        });

        it('invalid id in counterKey', () => {
            const options = getCounterOptions('abc:0');
            chai.expect(options).is.undefined;
        });
    });
});
