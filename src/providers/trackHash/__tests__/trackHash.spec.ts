import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sender from 'src/sender';
import * as globalConfig from 'src/storage/global';
import * as events from 'src/utils/events';
import * as defer from 'src/utils/defer';
import * as direct from 'src/utils/direct';
import * as errorLoggerUtils from 'src/utils/errorLogger';
import * as getCountersUtils from 'src/providers/getCounters/getCounters';
import {
    WATCH_URL_PARAM,
    WATCH_REFERER_PARAM,
    TRACK_HASH_BR_KEY,
    AD_BR_KEY,
    PAGE_VIEW_BR_KEY,
    NOINDEX_BR_KEY,
    IS_TRUSTED_EVENT_BR_KEY,
} from 'src/api/watch';
import { UNSUBSCRIBE_PROPERTY } from 'src/providers/index';
import { CounterOptions } from 'src/utils/counterOptions';
import { noop } from 'src/utils/function';
import { useTrackHash, HASH_CHECKS_INTERVAL } from '../trackHash';

describe('track hash provider', () => {
    const intervalId = 100;
    const lastRef = 'http://example.com';
    const sandbox = sinon.createSandbox();

    const senderStub = sandbox.stub().resolves();
    let counterStateStub: sinon.SinonStub<
        Parameters<ReturnType<typeof getCountersUtils.counterStateSetter>>,
        ReturnType<ReturnType<typeof getCountersUtils.counterStateSetter>>
    >;

    beforeEach(() => {
        sandbox.stub(globalConfig, 'getGlobalStorage').returns({
            setVal: sandbox.stub(),
            getVal: sandbox.stub().returns(lastRef),
        } as unknown as globalConfig.GlobalStorage);
        sandbox.stub(sender, 'getSender').returns(senderStub);
        sandbox
            .stub(errorLoggerUtils, 'errorLogger')
            .callsFake((_, __, fn) => fn || noop);
        sandbox
            .stub(errorLoggerUtils, 'ctxErrorLogger')
            .callsFake((_, fn) => fn);
        counterStateStub = sandbox.stub();
        sandbox
            .stub(getCountersUtils, 'counterStateSetter')
            .returns(counterStateStub);
    });

    afterEach(() => {
        senderStub.resetHistory();
        sandbox.restore();
    });

    it('works correctly in old browser', () => {
        const setIntervalStub = sandbox
            .stub(defer, 'setDeferInterval')
            .returns(intervalId);
        const clearIntervalStub = sandbox.stub(defer, 'clearDeferInterval');
        const directExistsStub = sandbox
            .stub(direct, 'yaDirectExists')
            .returns(true);

        const title = 'title';
        const oldBrowserCtx = {
            location: { hash: '#', href: 'https://google.com' },
            document: { title },
        } as Window;
        const counterOptions: CounterOptions = {
            id: 123,
            counterType: '0',
            trackHash: true,
            ut: true,
        };
        const result = useTrackHash(oldBrowserCtx, counterOptions);

        const [ctx, callback, timeout] = setIntervalStub.getCall(0).args;
        chai.expect(ctx).to.equal(oldBrowserCtx);
        chai.expect(timeout).to.equal(HASH_CHECKS_INTERVAL);
        sinon.assert.notCalled(senderStub);
        oldBrowserCtx.location.hash = '#hash?some-get-param=123';
        callback();

        sinon.assert.calledOnce(senderStub);
        const [senderOptions, counterOptionsCalled] =
            senderStub.getCall(0).args;
        chai.expect(senderOptions.brInfo.getVal(NOINDEX_BR_KEY)).to.equal('1');
        chai.expect(senderOptions.brInfo.getVal(PAGE_VIEW_BR_KEY)).to.equal(1);
        chai.expect(
            senderOptions.brInfo.getVal(IS_TRUSTED_EVENT_BR_KEY, 'undefined'),
        ).to.equal('undefined');

        chai.expect(senderOptions.brInfo.getVal(AD_BR_KEY)).to.equal('1');
        chai.expect(senderOptions.brInfo.getVal(TRACK_HASH_BR_KEY)).to.equal(1);

        chai.expect(counterOptionsCalled).to.equal(counterOptions);
        chai.expect(senderOptions.urlParams).to.deep.equal({
            [WATCH_URL_PARAM]: 'https://google.com',
            [WATCH_REFERER_PARAM]: lastRef,
        });

        result[UNSUBSCRIBE_PROPERTY]();
        sinon.assert.calledWith(clearIntervalStub, oldBrowserCtx, intervalId);

        setIntervalStub.restore();
        clearIntervalStub.restore();
        directExistsStub.restore();
    });

    it('works correctly in new browser and trackHash is working', () => {
        const unsubscribeCallback = sandbox.stub();
        const eventsHandlerOn = sandbox
            .stub<
                Parameters<events.EventSetter['on']>,
                ReturnType<events.EventSetter['on']>
            >()
            .returns(unsubscribeCallback);
        const eventsHandler = {
            on: eventsHandlerOn,
        } as unknown as events.EventSetter;
        const eventsStub = sandbox
            .stub(events, 'cEvent')
            .returns(eventsHandler);
        const directExistsStub = sandbox
            .stub(direct, 'yaDirectExists')
            .returns(false);

        const title = 'title';
        const newBrowserCtx = {
            onhashchange: () => {},
            location: { hash: '#', href: 'https://google.com' },
            document: { title },
        } as unknown as Window;
        const counterOptions: CounterOptions = {
            id: 123,
            counterType: '0',
        };
        const { trackHash } = useTrackHash(newBrowserCtx, counterOptions);

        sinon.assert.notCalled(eventsHandlerOn);
        trackHash(true);
        const [ctx, eventName, callback] = eventsHandlerOn.getCall(0).args;
        chai.expect(ctx).to.equal(newBrowserCtx);
        chai.expect(eventName).to.deep.equal(['hashchange']);
        sinon.assert.notCalled(senderStub);

        callback({ isTrusted: true } as HashChangeEvent);

        trackHash(false);
        const [senderOptions, counterOptionsCalled] =
            senderStub.getCall(0).args;
        chai.expect(senderOptions.brInfo.getVal(PAGE_VIEW_BR_KEY)).to.equal(1);
        chai.expect(senderOptions.brInfo.getVal(TRACK_HASH_BR_KEY)).to.equal(1);
        chai.expect(
            senderOptions.brInfo.getVal(IS_TRUSTED_EVENT_BR_KEY),
        ).to.equal(1);

        chai.expect(counterOptionsCalled).to.equal(counterOptions);
        chai.expect(senderOptions.urlParams).to.deep.equal({
            [WATCH_URL_PARAM]: 'https://google.com',
            [WATCH_REFERER_PARAM]: lastRef,
        });

        directExistsStub.restore();
        eventsStub.restore();
    });

    it('sets counter state', () => {
        const ctxStub = {
            onhashchange: () => {},
            location: { hash: '#', href: 'https://google.com' },
            document: { title: 'title' },
        } as unknown as Window;
        const { trackHash } = useTrackHash(ctxStub, {
            trackHash: undefined,
        } as CounterOptions);
        sinon.assert.notCalled(counterStateStub);

        trackHash(false);
        sinon.assert.calledWith(counterStateStub.getCall(0), {
            trackHash: false,
        });

        trackHash(true);
        sinon.assert.calledWith(counterStateStub.getCall(1), {
            trackHash: true,
        });
    });
});
