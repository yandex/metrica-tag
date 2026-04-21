import * as chai from 'chai';
import * as native from 'src/utils/function/isNativeFunction/toNativeOrFalse';
import * as sinon from 'sinon';
import { stringLastIndexOfPoly } from '../string';

describe('stringLastIndexOfPoly', () => {
    const sandbox = sinon.createSandbox();

    beforeEach(() => {
        sandbox.stub(native, 'toNativeOrFalse').callsFake((a) => a);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('finds substring at the end of the string', () => {
        chai.expect(stringLastIndexOfPoly('hello world', 'world')).to.be.eq(6);
    });

    it('finds the last occurrence in the middle of the string', () => {
        chai.expect(
            stringLastIndexOfPoly('hello hello world', 'hello'),
        ).to.be.eq(6);
    });

    it('returns -1 when substring is not found', () => {
        chai.expect(stringLastIndexOfPoly('hello world', 'xyz')).to.be.eq(-1);
    });

    it('handles empty search string', () => {
        chai.expect(stringLastIndexOfPoly('hello', '')).to.be.eq(5);
    });

    it('handles empty input string', () => {
        chai.expect(stringLastIndexOfPoly('', 'test')).to.be.eq(-1);
    });

    it('handles both strings empty', () => {
        chai.expect(stringLastIndexOfPoly('', '')).to.be.eq(0);
    });

    it('matches native lastIndexOf for repeated substrings', () => {
        const str = 'abc abc abc';
        const search = 'abc';
        chai.expect(stringLastIndexOfPoly(str, search)).to.be.eq(
            str.lastIndexOf(search),
        );
    });

    it('matches native lastIndexOf when substring is absent', () => {
        const str = 'hello world';
        const search = 'xyz';
        chai.expect(stringLastIndexOfPoly(str, search)).to.be.eq(
            str.lastIndexOf(search),
        );
    });

    it('matches native lastIndexOf when search string is longer than input', () => {
        const str = 'abc';
        const search = 'abcdef';
        chai.expect(stringLastIndexOfPoly(str, search)).to.be.eq(
            str.lastIndexOf(search),
        );
    });

    it('matches native lastIndexOf for special characters', () => {
        const str = 'test!@#$%^&*()';
        const search = '!@#';
        chai.expect(stringLastIndexOfPoly(str, search)).to.be.eq(
            str.lastIndexOf(search),
        );
    });

    it('returns the last occurrence index', () => {
        chai.expect(stringLastIndexOfPoly('a.b.c.d', '.')).to.be.eq(5);
    });

    it('handles single character search', () => {
        chai.expect(stringLastIndexOfPoly('hello', 'o')).to.be.eq(4);
        chai.expect(stringLastIndexOfPoly('hello', 'l')).to.be.eq(3);
    });
});
