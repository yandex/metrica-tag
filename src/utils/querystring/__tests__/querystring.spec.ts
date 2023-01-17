/* eslint-env mocha */
import * as chai from 'chai';
import { stringify, parse } from '..';

describe('QueryString', () => {
    it('should parse objects', () => {
        const parsed = parse('val&info=1');
        chai.expect(parsed.val).to.be.equal(undefined);
        chai.expect(parsed.info).to.be.equal('1');
    });
    it('should stringify objects', () => {
        const obj = {
            test: 1,
            badGuy: undefined,
            info: 2,
        };
        chai.expect(stringify(obj)).to.be.equal('test=1&info=2');
    });
});
