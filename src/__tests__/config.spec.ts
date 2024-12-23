/* eslint-env mocha */
import * as chai from 'chai';
import { config } from 'src/config';
import { isIE } from 'src/utils/browser/browser';

describe('config', () => {
    it('should not ie config', () => {
        if (!isIE(window)) {
            chai.expect(config.MAX_LEN_URL).to.be.equal(2048);
        }
    });
});
