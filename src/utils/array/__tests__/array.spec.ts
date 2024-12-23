import * as chai from 'chai';
import * as native from 'src/utils/function/isNativeFunction/toNativeOrFalse';
import * as sinon from 'sinon';
import { valuesPoly } from 'src/utils/object';
import { reversePoly } from '../reverse';
import { isArray, isArrayPolyfill } from '../isArray';
import { joinPoly } from '../join';
import { includes, includesPoly } from '../includes';
import { reducePoly } from '../reduce';
import { flatMap, flatMapPoly, mapPoly } from '../map';
import { cSome, somePoly } from '../some';
import { cFind, findPoly } from '../find';
import { exclude, getRange, toArray } from '../utils';

describe('Array utils', () => {
    const sandbox = sinon.createSandbox();
    beforeEach(() => {
        sandbox
            .stub(native, 'toNativeOrFalse')
            .callsFake(((a: any) => a) as any);
    });
    afterEach(() => {
        sandbox.restore();
    });
    it('joinPoly', () => {
        chai.expect(joinPoly('123123', [])).to.be.eq('');
        chai.expect(joinPoly('123123', [1])).to.be.eq('1');
        chai.expect(joinPoly('-', [1, 2])).to.be.eq('1-2');
        chai.expect(joinPoly('-', [1, 2, 3])).to.be.eq('1-2-3');
    });

    it('includesPoly checks elem in array', () => {
        chai.expect(includesPoly(1, [1, 2, 3])).to.be.ok;
        chai.expect(includesPoly(4, [1, 2, 3])).to.be.not.ok;
    });

    it('reducePoly trans args', () => {
        const sum = reducePoly(
            (prev: number, next: number) => {
                return prev + next;
            },
            0,
            [2, 2, 2],
        );
        chai.expect(sum).to.be.equal(6);
    });

    it('reducePoly def args', () => {
        const sum = reducePoly(
            (prev: number, next: number) => {
                return prev + next;
            },
            1,
            [2, 2, 2],
        );
        chai.expect(sum).to.be.equal(7);
    });

    it('reducePoly def index', () => {
        let index = 0;
        const sum = reducePoly(
            (prev: number, next: number, i: number) => {
                index = i;
                return prev + next;
            },
            1,
            [2, 2, 2],
        );
        chai.expect(index).to.be.equal(2);
        chai.expect(sum).to.be.equal(7);
    });

    it('mapPoly iterate arrays', () => {
        const result = mapPoly((i) => i * 2, [1, 2, 3]);
        chai.expect(result).to.be.an('array').that.does.deep.equal([2, 4, 6]);
    });

    it('mapPoly send index', () => {
        let index = 0;
        mapPoly(
            (_, i) => {
                index = i;
                return 1;
            },
            [1, 2, 3],
        );
        chai.expect(index).to.be.equal(2);
    });

    it('somePoly', () => {
        chai.expect(somePoly((el: number) => el > 5, [1, 5, 6, 7])).to.be.ok;
        chai.expect(somePoly((el: number) => el < 0, [1, 5, 6, 7])).to.be.not
            .ok;
    });

    it('findPoly', () => {
        chai.expect(findPoly((el: number) => el > 5, [1, 5, 6, 7])).to.be.equal(
            6,
        );
        chai.expect(findPoly((el: number) => el < 0, [1, 5, 6, 7])).to.be.equal(
            undefined,
        );
    });

    it('flatMapPoly', () => {
        chai.expect(flatMapPoly((el: number) => [el], [])).to.deep.equal([]);
        chai.expect(
            flatMapPoly((el: number) => [el, el], [1, 5]),
        ).to.deep.equal([1, 1, 5, 5]);
        chai.expect(
            flatMapPoly(
                (el: number) => {
                    if (el < 2) {
                        return [];
                    }
                    return [el, el * 2];
                },
                [1, 2, 3],
            ),
        ).to.deep.equal([2, 4, 3, 6]);
        chai.expect(flatMapPoly((el: number) => el, [1, 2])).to.deep.equal([
            1, 2,
        ]);
    });

    it('isArray Polyfill', () => {
        chai.expect(isArrayPolyfill([])).to.be.true;
        chai.expect(isArrayPolyfill({ length: 10 })).to.be.false;
    });

    it('valuesPoly iterate array', () => {
        const result = valuesPoly({
            test: 1,
            val: 2,
        });
        chai.expect(result).to.have.lengthOf(2);
        result.forEach((value) => chai.expect(value).to.be.oneOf([1, 2]));
    });

    it('isArray', () => {
        chai.expect(isArray([])).to.be.true;
        chai.expect(isArray({ length: 10 })).to.be.false;
    });

    it('exclude', () => {
        chai.expect(exclude(['a', 'b', 'c'], ['a', 'b'])).to.deep.equal(['c']);
    });

    it('getRange', () => {
        chai.expect(getRange(3)).to.deep.equal([0, 1, 2, 3]);
        chai.expect(getRange(-1)).to.deep.equal([]);
    });

    it('toArray', () => {
        const set = new Set();
        set.add(1);
        set.add(2);
        chai.expect(toArray(set)).to.deep.equal([1, 2]);
        chai.expect(toArray({ 0: 'a', 1: 'b', length: 2 })).to.deep.equal([
            'a',
            'b',
        ]);
        chai.expect(toArray(null)).to.deep.equal([]);
    });

    it('cSome', () => {
        chai.expect(cSome((el: number) => el > 5, [1, 5, 6, 7])).to.be.ok;
        chai.expect(cSome((el: number) => el < 0, [1, 5, 6, 7])).to.be.not.ok;
    });

    it('cFind', () => {
        chai.expect(cFind((el: number) => el > 5, [1, 5, 6, 7])).to.be.equal(6);
        chai.expect(cFind((el: number) => el < 0, [1, 5, 6, 7])).to.be.equal(
            undefined,
        );
    });

    it('cFind', () => {
        chai.expect(cFind((el: number) => el > 5, [1, 5, 6, 7])).to.be.equal(6);
        chai.expect(cFind((el: number) => el < 0, [1, 5, 6, 7])).to.be.equal(
            undefined,
        );
    });

    it('flatMap', () => {
        chai.expect(flatMap((el: number) => [el], [])).to.deep.equal([]);
        chai.expect(flatMap((el: number) => [el, el], [1, 5])).to.deep.equal([
            1, 1, 5, 5,
        ]);
        chai.expect(
            flatMap(
                (el: number) => {
                    if (el < 2) {
                        return [];
                    }
                    return [el, el * 2];
                },
                [1, 2, 3],
            ),
        ).to.deep.equal([2, 4, 3, 6]);
        chai.expect(flatMap((el: number) => el, [1, 2])).to.deep.equal([1, 2]);
    });

    it('includes', () => {
        chai.expect(includes(1, [12, 2, 1])).to.be.ok;
        chai.expect(includes(9, [12, 2, 1])).to.be.not.ok;
    });

    it('reverse', () => {
        chai.expect(reversePoly([1, 2, 3])).to.deep.equal([3, 2, 1]);
    });
});
