import { assert, expect } from 'chai';
import {
    is,
    has,
    isUndefined,
    isNull,
    isNil,
    isObject,
    isPlainObject,
    genPath,
    mix,
    entries,
    entriesPoly,
    assignPoly,
    keysPoly,
} from '..';
import { isPrimitive } from '../isPrimitive';

describe('object', () => {
    it('entriesPoly ok with undefined', () => {
        const result = entriesPoly(undefined);
        expect(result).to.have.lengthOf(0);
    });
    it('entriesPoly iterate array', () => {
        const result = entriesPoly({
            test: 1,
            val: 2,
        });
        expect(result).to.have.lengthOf(2);
        expect(result[0]).to.have.lengthOf(2);
        expect(result[0][0]).to.be.oneOf(['test', 'val']);
        expect(result[1][0]).to.be.oneOf(['test', 'val']);
        expect(result[0][1]).to.be.oneOf([1, 2]);
        expect(result[1][1]).to.be.oneOf([1, 2]);
    });
    it('assignPoly copy props', () => {
        const result = assignPoly(
            {
                info0: 1,
            },
            {
                info1: 2,
                test: 1,
            },
            {
                info3: 3,
                test: 2,
            },
        );
        expect(result.test).to.be.equal(2);
        expect(result.info0).to.be.equal(1);
        expect(result.info1).to.be.equal(2);
        expect(result.info3).to.be.equal(3);
    });
    it('assignPoly handles toString own prop (old IE only)', () => {
        const result = assignPoly(
            {},
            {
                toString: () => 'hooray',
            },
        );
        expect(`${result}`).to.be.equal('hooray');
    });
    it('keysPoly return obj keys', () => {
        const keys = keysPoly({
            test: 1,
        });
        expect(keys).to.include('test');
        expect(keys).to.not.include('length');
    });
    describe('is', () => {
        it('handles NaN', () => {
            assert.isTrue(is(NaN, NaN));
            assert.isTrue(is(NaN, 0 / 0));
        });
        it('handles SameValue zero', () => {
            assert.isFalse(is(0, -0));
            assert.isFalse(is(+0, -0));
            assert.isTrue(is(0, +0));
        });
    });
    it('has', () => {
        class Test {
            public b?: any;

            public a = 1;
        }
        Test.prototype.b = 2;

        const object = new Test();

        assert.isTrue(has(object, 'a'));
        assert.isFalse(has(object, 'b'));
        assert.isFalse(has(object, 'c'));
        assert.isFalse(has(null, 'a'));
        assert.isFalse(has(undefined, 'a'));
    });

    it('isUndefined', () => {
        const trueResult = undefined;
        const falseResult = null;

        assert.isTrue(isUndefined(undefined));
        assert.isTrue(isUndefined(trueResult));

        assert.isFalse(isUndefined(null));
        assert.isFalse(isUndefined(falseResult));

        assert.isFalse(isUndefined(0));
        assert.isFalse(isUndefined(false));
        assert.isFalse(isUndefined(''));
        assert.isFalse(isUndefined(NaN));
    });

    it('isNull', () => {
        const trueResult = null;
        const falseResult = undefined;

        assert.isTrue(isNull(null));
        assert.isTrue(isNull(trueResult));

        assert.isFalse(isNull(undefined));
        assert.isFalse(isNull(falseResult));

        assert.isFalse(isNull(0));
        assert.isFalse(isNull(false));
        assert.isFalse(isNull(''));
        assert.isFalse(isNull(NaN));
    });

    it('isNil', () => {
        const trueResult1 = null;
        const trueResult2 = undefined;

        assert.isTrue(isNil(null));
        assert.isTrue(isNil(undefined));
        assert.isTrue(isNil(trueResult1));
        assert.isTrue(isNil(trueResult2));

        assert.isFalse(isNil(0));
        assert.isFalse(isNil(false));
        assert.isFalse(isNil(''));
        assert.isFalse(isNil(NaN));
    });

    it('isPrimitive', () => {
        // eslint-disable-next-line no-restricted-globals
        const win = { isNaN, isFinite } as unknown as Window;

        assert.isTrue(isPrimitive(win, null));
        assert.isTrue(isPrimitive(win, undefined));
        assert.isTrue(isPrimitive(win, 0));
        assert.isTrue(isPrimitive(win, 11));
        assert.isTrue(isPrimitive(win, Number.MAX_SAFE_INTEGER));
        assert.isTrue(isPrimitive(win, ''));
        assert.isTrue(isPrimitive(win, '4'));
        assert.isTrue(isPrimitive(win, true));
        assert.isTrue(isPrimitive(win, false));

        assert.isFalse(isPrimitive(win, {}));
        assert.isFalse(isPrimitive(win, win));
        // eslint-disable-next-line no-new-wrappers
        assert.isFalse(isPrimitive(win, new Boolean()));
        assert.isFalse(isPrimitive(win, NaN));
    });

    it('isObject', () => {
        assert.isTrue(isObject({}));

        assert.isFalse(isObject('a'));
        assert.isFalse(isObject(1));
        assert.isFalse(isObject(false));
        assert.isFalse(isObject([]));
        assert.isFalse(isObject(function myF() {}));
        assert.isFalse(isObject(/a/));
    });

    it('isPlainObject', () => {
        // eslint-disable-next-line no-restricted-globals
        const win = { isNaN, isFinite } as unknown as Window;

        assert.isTrue(isPlainObject(win, {}));
        assert.isTrue(
            isPlainObject(win, {
                a: 'a',
                b: 3,
                c: true,
            }),
        );

        assert.isFalse(
            isPlainObject(win, {
                a: 'a',
                b: {
                    c: 2,
                },
            }),
        );
        assert.isFalse(isPlainObject(win, win));
        assert.isFalse(isPlainObject(win, 'a'));
        assert.isFalse(isPlainObject(win, 1));
        assert.isFalse(isPlainObject(win, false));
        assert.isFalse(isPlainObject(win, []));
        assert.isFalse(isPlainObject(win, function myF() {}));
        assert.isFalse(isPlainObject(win, /a/));
    });

    it('genPath', () => {
        const key1 = 'test.Key';
        const key2 = 'test.Key2';
        const val = 'testVal';
        const path = [key1, key2, val];
        const obj = genPath(path);
        expect(obj[key1][key2]).to.be.equal(val);

        const obj2Orig = {
            [key1]: val,
        };
        const obj2 = genPath([], obj2Orig);
        expect(obj2[key1]).to.be.equal(val);
        expect(obj2Orig[key1]).to.be.equal(val);
    });

    it('genPath / custom setter', () => {
        const testObject = {
            _firstChild: { a: 1 },
            changed: false,
        } as any;
        Object.defineProperty(testObject, 'firstChild', {
            get() {
                // eslint-disable-next-line no-underscore-dangle
                return this._firstChild;
            },
            set(val) {
                this.changed = true;
                // eslint-disable-next-line no-underscore-dangle
                this._firstChild = val;
            },
        });

        const obj = genPath(['firstChild', 'secondChild', '1'], testObject);

        expect(testObject.changed).to.be.equal(false);
        expect(obj.firstChild.secondChild).to.be.equal('1');
    });

    it('mix', () => {
        const result = mix(
            {
                info0: 1,
            },
            {
                info1: 2,
                test: 1,
            },
            {
                info3: 3,
                test: 2,
            },
        );
        expect(result.test).to.be.equal(2);
        expect(result.info0).to.be.equal(1);
        expect(result.info1).to.be.equal(2);
        expect(result.info3).to.be.equal(3);
    });

    it('entries', () => {
        const keys = entries({
            test: 1,
        });
        expect(keys[0]).to.include('test');
        expect(keys[0]).to.not.include('length');
        const key = entries();
        expect(key).to.be.deep.equal([]);
    });
});
