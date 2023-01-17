/* eslint-env mocha */
import { JSDOMWrapper } from 'src/__tests__/utils/jsdom';
import * as chai from 'chai';
import { getTransportList } from '..';

describe('transportList', () => {
    const { window } = new JSDOMWrapper();
    it('returns at least one transport', () => {
        chai.expect(getTransportList(window).length).to.be.ok;
    });
});
