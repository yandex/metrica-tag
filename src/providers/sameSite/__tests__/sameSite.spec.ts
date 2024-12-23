import { expect } from 'chai';
import * as sinon from 'sinon';
import * as brow from 'src/utils/browser/browser';
import * as loc from 'src/utils/location/location';
import { getSameSiteCookieInfo } from '../sameSite';

describe('provider / sameSite', () => {
    const sandbox = sinon.createSandbox();
    let browserStub: sinon.SinonStub<[Window], boolean>;
    let isHttpsStub: sinon.SinonStub<[Window], boolean>;
    beforeEach(() => {
        browserStub = sandbox.stub(brow, 'isSameSiteBrowser');
        isHttpsStub = sandbox.stub(loc, 'isHttps');
    });
    afterEach(() => {
        sandbox.restore();
    });
    it('returns empty list if is not sameSite', () => {
        browserStub.returns(false);
        expect(getSameSiteCookieInfo({} as any)).to.equal('');
    });
    it('returns empty list if http', () => {
        browserStub.returns(true);
        isHttpsStub.returns(false);
        expect(getSameSiteCookieInfo({} as any)).to.equal('');
    });
    it('returns empty sameSite and secure if https', () => {
        browserStub.returns(true);
        isHttpsStub.returns(true);
        expect(getSameSiteCookieInfo({} as any)).to.equal(
            'SameSite=None;Secure;',
        );
    });
});
