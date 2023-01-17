import { noop } from 'src/utils/function';
import * as chai from 'chai';
import * as sinon from 'sinon';
import {
    isCookieAllowed,
    COOKIE_CHECK_CALLBACKS,
    COOKIES_WHITELIST,
} from '../isAllowed';
import { CookieGetter } from '../types';

describe('storage/cookie/isAllowed', () => {
    const sandbox = sinon.createSandbox();
    const ctx = {} as unknown as Window;
    const getCookieStub = noop as unknown as CookieGetter;
    afterEach(() => {
        sandbox.restore();
        COOKIE_CHECK_CALLBACKS.splice(0, COOKIE_CHECK_CALLBACKS.length);
    });
    it('returns true if COOKIE_CHECK_CALLBACKS is empty', () => {
        chai.expect(
            isCookieAllowed(ctx, getCookieStub, 'some cookie'),
        ).to.equal(true);
    });
    it('returns true if cookie is whitelisted', () => {
        const checkStub = sandbox.stub().returns(false);
        COOKIE_CHECK_CALLBACKS.push(checkStub);
        chai.expect(
            isCookieAllowed(ctx, getCookieStub, COOKIES_WHITELIST[0]),
        ).to.equal(true);
        sinon.assert.notCalled(checkStub);
    });
    it('returns false if check callback returns false', () => {
        const checkStub = sandbox.stub().returns(false);
        const cookie = 'some cookie';
        COOKIE_CHECK_CALLBACKS.push(checkStub);
        chai.expect(isCookieAllowed(ctx, getCookieStub, cookie)).to.equal(
            false,
        );
        sinon.assert.calledWith(checkStub, ctx, getCookieStub, cookie);
    });
});
