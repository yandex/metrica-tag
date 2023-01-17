/* eslint-env mocha */
import * as chai from 'chai';
import { ternary } from '../condition';

describe('Condition utils', () => {
    it('ternary', () => {
        const first = 1;
        const second = 2;

        chai.expect(ternary(first, second, true)).to.eq(first);
        chai.expect(ternary(first, second, false)).to.eq(second);
    });
});
