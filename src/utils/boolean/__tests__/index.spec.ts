import * as chai from 'chai';
import { toOneOrNull, toZeroOrOne } from '../index';

describe('Boolean utils', () => {
    it('toZeroOrOne', () => {
        chai.expect(toZeroOrOne(true)).to.eq(1);
        chai.expect(toZeroOrOne(false)).to.eq(0);
    });
    it('toNullOrOne', () => {
        chai.expect(toOneOrNull(true)).to.eq(1);
        chai.expect(toOneOrNull(false)).to.eq(null);
    });
});
