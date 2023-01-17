import { expect } from 'chai';
import { padEnd, padStart } from '../repeat';
import { stringIndexOfPoly } from '../string';

describe('stringIndexOfPoly', () => {
    it('Gets indexes correctly', () => {
        expect(stringIndexOfPoly('abcde', 'a')).to.equal(0);
        expect(stringIndexOfPoly('abcde', 'bcde')).to.equal(1);
        expect(stringIndexOfPoly('abcde', 'cde')).to.equal(2);
        expect(stringIndexOfPoly('abcde', 'def')).to.equal(-1);
        expect(stringIndexOfPoly('abcde', 'z')).to.equal(-1);
    });
});

describe('padding', () => {
    it('padStart', () => {
        expect(padStart('0', 6, '111')).to.equal('000111');
        expect(padStart('0', 6.5, '111')).to.equal('000111');
        expect(padStart('', 8, '111')).to.equal('111');
        expect(padStart('0', 3, '111')).to.equal('111');
        expect(padStart('0', 2, '111')).to.equal('111');
        expect(padStart('0', 6, '')).to.equal('000000');
    });

    it('padEnd', () => {
        expect(padEnd('0', 6, '111')).to.equal('111000');
        expect(padEnd('0', 6.5, '111')).to.equal('111000');
        expect(padEnd('', 8, '111')).to.equal('111');
        expect(padEnd('0', 3, '111')).to.equal('111');
        expect(padEnd('0', 2, '111')).to.equal('111');
        expect(padEnd('0', 6, '')).to.equal('000000');
    });
});
