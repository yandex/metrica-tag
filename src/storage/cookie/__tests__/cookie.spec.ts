import * as chai from 'chai';
import * as sinon from 'sinon';
import * as isAllowed from '../isAllowed';
import { ENABLED_COOKIE_KEY } from '../const';
import * as cookieStorage from '../cookie';

describe('Cookie Storage', () => {
    const sandbox = sinon.createSandbox();
    let cookieState: any = null;
    beforeEach(() => {
        sandbox.stub(isAllowed, 'isCookieAllowed').returns(true);
        sandbox
            .stub(cookieStorage, 'getCookieState')
            .callsFake(() => cookieState);
    });

    afterEach(() => {
        sandbox.restore();
        cookieState = null;
    });

    it('should parse document cookie and not fail of cookie is undefined', () => {
        const win: any = {
            document: {
                cookie: 'a=1; b=2; brokenCookie=x%DA%8B%8E%05%00%01%15%00%B9',
            },
        };
        chai.expect(cookieStorage.parseCookie(win)).to.deep.equal({
            a: '1',
            b: '2',
            brokenCookie: '',
        });
        win.document.cookie = undefined;
        chai.expect(cookieStorage.parseCookie(win)).to.equal(null);
    });

    it('getCookie should use cookie cache', () => {
        const win: any = {};
        cookieState = {
            a: '123',
        };
        chai.expect(cookieStorage.getCookie(win, 'a')).to.equal('123');
    });

    it('checks if cookie can be set', () => {
        cookieState = {
            [ENABLED_COOKIE_KEY]: '1',
        };
        const win: any = {};
        const domain = 'example.com';
        const path = '/';
        sandbox.stub(cookieStorage, 'deleteCookie');
        sandbox.stub(cookieStorage, 'setCookie');
        sandbox.stub(cookieStorage, 'parseCookie').returns(cookieState);
        chai.expect(cookieStorage.checkCookie(win, domain, path)).to.equal(
            true,
        );
        cookieState[ENABLED_COOKIE_KEY] = null;
        chai.expect(cookieStorage.checkCookie(win, domain, path)).to.equal(
            false,
        );
    });

    it('gets root domain (the highest-level domain where setting cookies is permitted)', () => {
        const correctDomain = 'a.b.example.com';
        const originalDomain = `1.${correctDomain}`;
        const win: any = {
            location: {
                host: originalDomain,
            },
        };
        const checkCookie = sandbox
            .stub(cookieStorage, 'checkCookie')
            .callsFake((ctx, domain) => {
                chai.expect(ctx).to.equal(win);
                return domain === correctDomain;
            });

        chai.expect(cookieStorage.getRootDomain(win)).to.equal(correctDomain);
        sinon.assert.calledThrice(checkCookie);
    });

    it('should write document cookie', () => {
        const win: any = {
            document: {
                cookie: null,
            },
        };
        cookieState = {
            cookie1: '1',
        };
        cookieStorage.setCookie(
            win,
            'cookie1',
            'val',
            0,
            'example.com',
            '/a/b/c',
        );
        chai.expect(cookieState.cookie1).to.equal('val');
        chai.expect(win.document.cookie).to.equal(
            'cookie1=val;domain=example.com;path=/a/b/c',
        );
    });
});
