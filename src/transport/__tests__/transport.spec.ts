/* eslint-env mocha */
import * as chai from 'chai';
import { JSDOMWrapper } from 'src/__tests__/utils/jsdom';
import { DEFAULT_COUNTER_TYPE } from 'src/providers/counterOptions';
import type { CounterOptions } from 'src/utils/counterOptions';
import { getTransportList } from '..';

describe('transportList', () => {
    const { window } = new JSDOMWrapper();
    it('returns at least one transport', () => {
        const opt: CounterOptions = {
            id: 123,
            counterType: DEFAULT_COUNTER_TYPE,
        };
        chai.expect(getTransportList(window, opt).length).to.be.ok;
    });
});
