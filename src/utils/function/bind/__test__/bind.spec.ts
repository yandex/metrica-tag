import * as chai from 'chai';
import { callPoly } from '../bind';

describe('callPoly', () => {
    it('Works', () => {
        let counter = 0;
        const fn = () => {
            counter += 1;
            return counter;
        };
        let result = callPoly(fn);
        chai.expect(result).to.be.equal(1);
        result = callPoly(fn, [1]);
        chai.expect(result).to.be.equal(2);
        result = callPoly(fn, [1, 1]);
        chai.expect(result).to.be.equal(3);
        result = callPoly(fn, [1, 1, 1]);
        chai.expect(result).to.be.equal(4);
        result = callPoly(fn, [1, 1, 1, 1]);
        chai.expect(result).to.be.equal(5);
    });
});
