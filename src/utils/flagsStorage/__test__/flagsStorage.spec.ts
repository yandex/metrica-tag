/* eslint-env mocha */
import * as chai from 'chai';
import * as sinon from 'sinon';
import { flagStorage } from '../flagsStorage';

describe('flagsStorage', () => {
    const serialize = sinon.stub();
    beforeEach(() => {
        serialize.resetHistory();
    });
    it('inits', () => {
        const flags = {
            test: 1,
        };
        const info = flagStorage(serialize)(flags);
        const emInfo = flagStorage(serialize)(null);
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
        info.serialize();
        const [infoSerializeFlags] = serialize.getCall(0).args;
        chai.expect(infoSerializeFlags).to.equal(flags);
    });
});
