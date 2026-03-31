import * as chai from 'chai';
import { SetPoly } from '../polyfill';

describe('SetPoly', () => {
    it('creates empty set with size 0', () => {
        const set = new SetPoly();
        chai.expect(set.size).to.be.equal(0);
    });

    it('creates set from initial values', () => {
        const set = new SetPoly([1, 2, 3]);
        chai.expect(set.size).to.be.equal(3);
        chai.expect(set.has(1)).to.be.true;
        chai.expect(set.has(2)).to.be.true;
        chai.expect(set.has(3)).to.be.true;
    });

    it('deduplicates initial values', () => {
        const set = new SetPoly([1, 2, 2, 3, 3, 3]);
        chai.expect(set.size).to.be.equal(3);
    });

    it('handles null and undefined as initial values', () => {
        const set = new SetPoly<number | null>(null);
        chai.expect(set.size).to.be.equal(0);

        const set2 = new SetPoly<number | null>(undefined);
        chai.expect(set2.size).to.be.equal(0);
    });

    describe('add', () => {
        it('adds values and updates size', () => {
            const set = new SetPoly<number>();
            set.add(1);
            set.add(2);
            chai.expect(set.size).to.be.equal(2);
            chai.expect(set.has(1)).to.be.true;
            chai.expect(set.has(2)).to.be.true;
        });

        it('does not add duplicate values', () => {
            const set = new SetPoly<number>();
            set.add(1);
            set.add(1);
            chai.expect(set.size).to.be.equal(1);
        });

        it('returns this for chaining', () => {
            const set = new SetPoly<number>();
            const result = set.add(1).add(2).add(3);
            chai.expect(result).to.equal(set);
            chai.expect(set.size).to.be.equal(3);
        });
    });

    describe('has', () => {
        it('returns true for existing values', () => {
            const set = new SetPoly([10, 20]);
            chai.expect(set.has(10)).to.be.true;
            chai.expect(set.has(20)).to.be.true;
        });

        it('returns false for missing values', () => {
            const set = new SetPoly([10, 20]);
            chai.expect(set.has(30)).to.be.false;
        });

        it('works with string values', () => {
            const set = new SetPoly(['a', 'b']);
            chai.expect(set.has('a')).to.be.true;
            chai.expect(set.has('c')).to.be.false;
        });
    });

    describe('delete', () => {
        it('removes existing value and updates size', () => {
            const set = new SetPoly([1, 2, 3]);
            const result = set.delete(2);
            chai.expect(result).to.be.true;
            chai.expect(set.size).to.be.equal(2);
            chai.expect(set.has(2)).to.be.false;
        });

        it('returns false for missing value', () => {
            const set = new SetPoly([1, 2]);
            const result = set.delete(5);
            chai.expect(result).to.be.false;
            chai.expect(set.size).to.be.equal(2);
        });
    });

    describe('clear', () => {
        it('removes all values and resets size', () => {
            const set = new SetPoly([1, 2, 3]);
            set.clear();
            chai.expect(set.size).to.be.equal(0);
            chai.expect(set.has(1)).to.be.false;
            chai.expect(set.has(2)).to.be.false;
            chai.expect(set.has(3)).to.be.false;
        });
    });

    describe('forEach', () => {
        it('iterates over all values', () => {
            const set = new SetPoly([10, 20, 30]);
            const collected: number[] = [];
            set.forEach((value, value2) => {
                chai.expect(value).to.equal(value2);
                collected.push(value);
            });
            chai.expect(collected).to.deep.equal([10, 20, 30]);
        });

        it('passes set as third argument', () => {
            const set = new SetPoly([1]);
            set.forEach((_v, _v2, s) => {
                chai.expect(s).to.equal(set);
            });
        });

        it('does not call callback for empty set', () => {
            const set = new SetPoly<number>();
            let called = false;
            set.forEach(() => {
                called = true;
            });
            chai.expect(called).to.be.false;
        });
    });
});
