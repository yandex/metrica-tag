/* eslint-env mocha */
import * as chai from 'chai';
import { telemetry } from '../telemetry';

describe('telemetry', () => {
    it('inits', () => {
        const flags = {
            test: 1,
        };
        const info = telemetry(flags);
        const emInfo = telemetry(null);
        chai.expect(emInfo.ctx()).to.be.deep.equal({});
        chai.expect(info.ctx()).to.be.deep.equal(flags);
        chai.expect(info.setVal('q', 1).ctx()).to.be.deep.equal({
            test: 1,
            q: 1,
        });
        chai.expect(flags).to.be.deep.equal({
            test: 1,
            q: 1,
        });
        chai.expect(info.serialize()).to.equal('test(1)q(1)');
    });
});
