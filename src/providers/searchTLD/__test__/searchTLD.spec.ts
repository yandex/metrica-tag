import * as sinon from 'sinon';
import * as chai from 'chai';
import { host } from 'src/config';
import * as searchTLD from '../searchTLD';

describe('searchTLD', () => {
    const sandbox = sinon.createSandbox();
    const ctx = {} as Window;
    afterEach(() => {
        sandbox.restore();
    });

    it('returns default host if no overrides are defined', () => {
        sandbox.stub(searchTLD, 'TLD_OVERRIDES').value([]);
        chai.expect(searchTLD.getDomainAndTLD(ctx, 'watch')).to.equal(host);
    });

    it('returns default host if no overrides are fired', () => {
        const override = sinon.stub().returns(undefined);
        sandbox.stub(searchTLD, 'TLD_OVERRIDES').value([override]);
        chai.expect(searchTLD.getDomainAndTLD(ctx, 'watch')).to.equal(host);
        sinon.assert.calledWith(override, ctx, 'watch');
    });

    it('returns overriden host if override is defined', () => {
        const override = sinon.stub().returns('example.com');
        sandbox.stub(searchTLD, 'TLD_OVERRIDES').value([override]);
        chai.expect(searchTLD.getDomainAndTLD(ctx, 'watch')).to.equal(
            'example.com',
        );
        sinon.assert.calledWith(override, ctx, 'watch');
    });
});
