import * as chai from 'chai';
import { MapPoly } from '../polyfill';

describe('MapPoly', () => {
    it('creates empty map', () => {
        const map = new MapPoly();
        chai.expect(map.size).to.be.equal(0);
    });

    it('creates map from entries', () => {
        const map = new MapPoly([
            ['a', 1],
            ['b', 2],
        ]);
        chai.expect(map.size).to.be.equal(2);
        chai.expect(map.has('a')).to.be.true;
        chai.expect(map.has('b')).to.be.true;
    });

    it('set adds entry and returns this', () => {
        const map = new MapPoly<string, number>();
        const result = map.set('key', 42);
        chai.expect(result).to.be.equal(map);
        chai.expect(map.size).to.be.equal(1);
        chai.expect(map.has('key')).to.be.true;
    });

    it('set overwrites existing key', () => {
        const map = new MapPoly<string, number>();
        map.set('key', 1);
        map.set('key', 2);
        chai.expect(map.size).to.be.equal(1);
    });

    it('get returns value by key', () => {
        const map = new MapPoly([
            ['a', 1],
            ['b', 2],
        ]);
        chai.expect(map.get('a')).to.be.equal(1);
        chai.expect(map.get('b')).to.be.equal(2);
    });

    it('get returns undefined for missing key', () => {
        const map = new MapPoly<string, number>();
        chai.expect(map.get('missing')).to.be.undefined;
    });

    it('has returns false for missing key', () => {
        const map = new MapPoly<string, number>();
        chai.expect(map.has('missing')).to.be.false;
    });

    it('delete removes existing key', () => {
        const map = new MapPoly<string, number>();
        map.set('a', 1);
        const result = map.delete('a');
        chai.expect(result).to.be.true;
        chai.expect(map.size).to.be.equal(0);
        chai.expect(map.has('a')).to.be.false;
    });

    it('delete returns false for missing key', () => {
        const map = new MapPoly<string, number>();
        chai.expect(map.delete('missing')).to.be.false;
    });

    it('clear removes all entries', () => {
        const map = new MapPoly([
            ['a', 1],
            ['b', 2],
            ['c', 3],
        ]);
        map.clear();
        chai.expect(map.size).to.be.equal(0);
        chai.expect(map.has('a')).to.be.false;
    });

    it('forEach iterates over entries', () => {
        const map = new MapPoly([
            ['a', 1],
            ['b', 2],
        ]);
        const keys: string[] = [];
        const values: number[] = [];
        map.forEach((value, key) => {
            keys.push(key);
            values.push(value);
        });
        chai.expect(keys).to.deep.equal(['a', 'b']);
        chai.expect(values).to.deep.equal([1, 2]);
    });

    it('forEach passes map as third argument', () => {
        const map = new MapPoly([['a', 1]]);
        map.forEach((_value, _key, m) => {
            chai.expect(m).to.be.equal(map);
        });
    });

    it('supports chaining via set', () => {
        const map = new MapPoly<string, number>();
        map.set('a', 1).set('b', 2).set('c', 3);
        chai.expect(map.size).to.be.equal(3);
    });
});
