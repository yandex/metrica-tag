import * as chai from 'chai';
import * as sinon from 'sinon';
import * as errorLogger from 'src/utils/errorLogger/errorLogger';
import * as sender from 'src/sender/index';
import * as browserInfo from 'src/utils/browserInfo/browserInfo';
import * as DebugConsole from 'src/providers/debugConsole/debugConsole';
import {
    WATCH_URL_PARAM,
    WATCH_REFERER_PARAM,
    PAGE_VIEW_BR_KEY,
    ARTIFICIAL_BR_KEY,
} from 'src/api/watch';
import { syncPromise } from 'src/__tests__/utils/syncPromise';
import { CounterOptions } from 'src/utils/counterOptions';
import { artificialHitProvider } from '../artificialHit';
import { METHOD_NAME_HIT } from '../const';

describe('providers / artificial hit', () => {
    const sandbox = sinon.createSandbox();
    const senderStub = sandbox.stub().returns(syncPromise);
    const counterOptions = { id: 123 } as CounterOptions;
    let logSpy: sinon.SinonSpy;
    let getSenderStub: sinon.SinonStub<any, any>;
    let errorLoggerStub: sinon.SinonStub<any, any>;
    let debugConsoleStub: sinon.SinonStub<any, any>;
    let browserInfoStub: sinon.SinonStub<any, any>;

    beforeEach(() => {
        browserInfoStub = sandbox.stub(browserInfo, 'browserInfo');
        browserInfoStub.callsFake((obj) => obj as any);
        logSpy = sandbox.spy();
        debugConsoleStub = sandbox.stub(DebugConsole, 'getLoggerFn');
        debugConsoleStub.returns(logSpy as any);
        getSenderStub = sandbox.stub(sender, 'getSender');
        getSenderStub.returns(senderStub);

        errorLoggerStub = sandbox.stub(errorLogger, 'errorLogger');

        errorLoggerStub.callsFake((ctx, scopeName, fn) => {
            return (...args: any[]) => {
                if (fn) {
                    fn(...args);
                }
            };
        });
    });

    afterEach(() => {
        senderStub.resetHistory();
        sandbox.restore();
    });

    it('sends artificial hit and ignores artificial hit if url is not changed', () => {
        const ctx = {};
        const params = {
            a: 1,
            b: 1,
        };
        const callback = sinon.stub();
        const context = {};
        const referer = 'reff';
        const title = 'Title';
        const url = 'http://example.com';

        const makeArtificialHit = artificialHitProvider(
            ctx as any,
            counterOptions,
        );
        makeArtificialHit[METHOD_NAME_HIT](
            url,
            title,
            referer,
            params,
            callback,
            context,
        );
        sinon.assert.calledOnce(logSpy);
        const [senderOptions, counterOptionsCalled] =
            senderStub.getCall(0).args;
        chai.expect(counterOptionsCalled).to.equal(counterOptions);
        chai.expect(senderOptions).to.deep.equal({
            middlewareInfo: {
                params,
                title,
            },
            urlParams: {
                [WATCH_URL_PARAM]: url,
                [WATCH_REFERER_PARAM]: referer,
            },
            brInfo: {
                [PAGE_VIEW_BR_KEY]: 1,
                [ARTIFICIAL_BR_KEY]: 1,
            },
        });
        sinon.assert.calledOnce(callback);
        chai.expect(callback.thisValues[0]).to.be.equal(context);
    });

    it('sends artificial hit when called with no arguments', () => {
        const url = 'http://example.com';
        const referrer = 'reff';
        const ctx = {
            location: {
                href: url,
            },
            document: {
                referrer,
            },
        };
        const makeArtificialHit = artificialHitProvider(
            ctx as any,
            counterOptions,
        );
        makeArtificialHit[METHOD_NAME_HIT]();
        sinon.assert.calledOnce(logSpy);
        sinon.assert.calledWithExactly(
            senderStub,
            {
                middlewareInfo: {
                    params: undefined,
                    title: undefined,
                },
                urlParams: {
                    [WATCH_URL_PARAM]: url,
                    [WATCH_REFERER_PARAM]: referrer,
                },
                brInfo: {
                    [PAGE_VIEW_BR_KEY]: 1,
                    [ARTIFICIAL_BR_KEY]: 1,
                },
            },
            counterOptions,
        );
    });

    it('if both referrer and referer is specified, ignores referer, uses referrer in hit', () => {
        const url = 'http://example.com';
        const ctx = {} as Window;
        const referrer = 'referrer';
        const referer = 'referer';
        const makeArtificialHit = artificialHitProvider(ctx, counterOptions);
        makeArtificialHit[METHOD_NAME_HIT](url, {
            referrer,
            referer,
        });
        sinon.assert.calledOnceWithExactly(
            senderStub,
            {
                middlewareInfo: {
                    params: undefined,
                    title: undefined,
                },
                urlParams: {
                    [WATCH_URL_PARAM]: url,
                    [WATCH_REFERER_PARAM]: referrer,
                },
                brInfo: {
                    [PAGE_VIEW_BR_KEY]: 1,
                    [ARTIFICIAL_BR_KEY]: 1,
                },
            },
            counterOptions,
        );
    });
});
