import * as chai from 'chai';
import * as sinon from 'sinon';
import * as isAllowed from '../isAllowed';
import { ENABLED_COOKIE_KEY } from '../const';
import * as cookieStorage from '../cookie';

describe('Cookie Storage', () => {
    const sandbox = sinon.createSandbox();
    let cookieState: Record<string, string | string[]> | null = null;
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

    it('parses document cookie and not fail of cookie is undefined', () => {
        const win = {
            document: {
                cookie: 'a=1; b=2; a=3; brokenCookie=x%DA%8B%8E%05%00%01%15%00%B9',
            },
        } as Window;
        chai.expect(cookieStorage.parseCookie(win)).to.deep.equal({
            a: ['1', '3'],
            b: '2',
            brokenCookie: '',
        });
    });

    it('document cookie parsing does not fail if received nil value', () => {
        const win = { document: { cookie: undefined } } as unknown as Window;
        chai.expect(cookieStorage.parseCookie(win)).to.equal(null);
    });

    it('returns last value by default and all values with a flag', () => {
        const storage = cookieStorage.cookieStorage({} as Window);
        cookieState = {
            _ym_one: ['1', '2'],
        };
        chai.expect(storage.getVal('one')).to.equal('2');
        chai.expect(storage.getVal('one', true)).to.deep.equal(['1', '2']);
        chai.expect(storage.getVal('none', true)).to.deep.equal(null);
    });

    it('getCookie should use cookie cache', () => {
        const win = {} as Window;
        cookieState = {
            a: '123',
        };
        chai.expect(cookieStorage.getCookie(win, 'a')).to.equal('123');
    });

    it('checks if cookie can be set', () => {
        cookieState = {
            [ENABLED_COOKIE_KEY]: '1',
        };
        const win = {} as Window;
        const domain = 'example.com';
        const path = '/';
        sandbox.stub(cookieStorage, 'deleteCookie');
        sandbox.stub(cookieStorage, 'setCookie');
        sandbox.stub(cookieStorage, 'parseCookie').returns(cookieState);
        chai.expect(cookieStorage.checkCookie(win, domain, path)).to.equal(
            true,
        );
        Object.assign(cookieState, { [ENABLED_COOKIE_KEY]: null });
        chai.expect(cookieStorage.checkCookie(win, domain, path)).to.equal(
            false,
        );
    });

    it('gets root domain (the highest-level domain where setting cookies is permitted)', () => {
        const correctDomain = 'a.b.example.com';
        const originalDomain = `1.${correctDomain}`;
        const win = { location: { host: originalDomain } } as Window;
        const checkCookie = sandbox
            .stub(cookieStorage, 'checkCookie')
            .callsFake((ctx, domain) => {
                chai.expect(ctx).to.equal(win);
                return domain === correctDomain;
            });

        chai.expect(cookieStorage.getRootDomain(win)).to.equal(correctDomain);
        sinon.assert.calledThrice(checkCookie);
    });

    it('writes document cookie', () => {
        const win = { document: { cookie: null } } as unknown as Window;
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

    it('refreshes cached state from document cookies after writing', () => {
        let documentCookie = 'cookie1=old';
        const win = {
            document: {
                get cookie() {
                    return documentCookie;
                },
                set cookie(value: string) {
                    documentCookie = `${documentCookie};${value}`;
                },
            },
        } as unknown as Window;
        cookieState = {
            cookie1: 'old',
        };

        cookieStorage.setCookie(win, 'cookie1', 'val');

        chai.expect(cookieState.cookie1).to.deep.equal(['old', 'val']);
    });

    it('refreshes cached state when writing overwrites an existing cookie', () => {
        const cookieMap: Record<string, string> = {
            cookie1: 'old',
        };
        const win = {
            document: {
                get cookie() {
                    return `cookie1=${cookieMap.cookie1}`;
                },
                set cookie(value: string) {
                    const cookie = /^([^=]+)=([^;]*)/.exec(value);
                    if (cookie) {
                        cookieMap[cookie[1]] = cookie[2];
                    }
                },
            },
        } as unknown as Window;
        cookieState = {
            cookie1: 'old',
        };

        cookieStorage.setCookie(win, 'cookie1', 'val');

        chai.expect(cookieState.cookie1).to.equal('val');
    });
});
