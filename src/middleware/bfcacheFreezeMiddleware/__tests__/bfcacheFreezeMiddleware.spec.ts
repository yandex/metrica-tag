import * as chai from 'chai';
import * as sinon from 'sinon';
import * as eventUtils from 'src/utils/events';
import { CounterOptions } from 'src/utils/counterOptions';
import { SenderInfo } from 'src/sender/SenderInfo';
import { bfCacheFreezeMiddleware } from '../bfcacheFreezeMiddleware';

describe('bfcacheFreezeMiddleware', () => {
    const sandbox = sinon.createSandbox();
    const onEvent = sandbox.stub();
    const fakeEventSetter = {
        on: onEvent,
    } as unknown as ReturnType<typeof eventUtils.cEvent>;
    let cEvent: sinon.SinonStub<
        Parameters<typeof eventUtils.cEvent>,
        ReturnType<typeof eventUtils.cEvent>
    >;

    beforeEach(() => {
        cEvent = sandbox.stub(eventUtils, 'cEvent').returns(fakeEventSetter);
        sandbox.stub(eventUtils, 'hasPageTransitionEvents').returns(true);
    });

    afterEach(() => {
        sandbox.restore();
        onEvent.resetHistory();
    });

    it('freezes events on pagehide requests and unfreezes them on pageshow', () => {
        const ctx = {} as Window;
        const counterOptions = {} as CounterOptions;
        const middleware = bfCacheFreezeMiddleware(ctx, counterOptions);
        sinon.assert.calledOnceWithExactly(cEvent, ctx);

        const transportOptions = {} as SenderInfo;
        const next = sandbox.stub();

        // Calls next by default
        middleware.beforeRequest!(transportOptions, next);
        sinon.assert.calledOnce(next);

        const [phideTarget, pHideEvent, pHideCallback] =
            onEvent.getCall(0).args;
        chai.expect(phideTarget).to.equal(ctx);
        chai.expect(pHideEvent).to.deep.equal(['pagehide']);

        const [pShowTarget, pShowEvent, pShowCallback] =
            onEvent.getCall(1).args;
        chai.expect(pShowTarget).to.equal(ctx);
        chai.expect(pShowEvent).to.deep.equal(['pageshow']);

        // Calls next if pagehide is not persisted
        const notPersistedPageHideEvent = {
            persisted: false,
        } as PageTransitionEvent;
        pHideCallback(notPersistedPageHideEvent);
        middleware.beforeRequest!(transportOptions, next);
        sinon.assert.calledTwice(next);

        // Freezes request on persisted pagehide event
        const persistedPageHideEvent = {
            persisted: true,
        } as PageTransitionEvent;
        pHideCallback(persistedPageHideEvent);
        middleware.beforeRequest!(transportOptions, next);
        sinon.assert.calledTwice(next);

        // Unfreezes frozen requests on pageShow
        pShowCallback({} as PageTransitionEvent);
        sinon.assert.calledThrice(next);

        // Calls next afterwards
        middleware.beforeRequest!(transportOptions, next);
        sinon.assert.callCount(next, 4);
    });
});
