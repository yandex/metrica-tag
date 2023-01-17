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
} from 'src/api/watch';
import { UNSUBSCRIBE_PROPERTY } from 'src/providers/index';
import { useTrackHash, HASH_CHECKS_INTERVAL } from '../trackHash';

describe('track hash provider', () => {
    const intervalId = 100;
    const lastRef = 'http://example.com';
    const sandbox = sinon.createSandbox();

    const senderStub = sinon.stub().returns({
        catch: () => {},
    } as any);
    let counterStateStub: sinon.SinonStub;

    const lastArg = (...args: unknown[]) => args[args.length - 1] as any;
    const verifyCounterStateCall = (callIndex: number, expectedValue: any) => {
        const { args } = counterStateStub.getCall(callIndex);
        chai.expect(args[0]).to.deep.eq({
            trackHash: expectedValue,
        });
        chai.expect(args.length).to.eq(1);
    };

    beforeEach(() => {
        sandbox.stub(globalConfig, 'getGlobalStorage').returns({
            setVal: sinon.stub(),
            getVal: sinon.stub().returns(lastRef),
        } as any);
        sandbox.stub(sender, 'getSender').returns(senderStub);
        sandbox.stub(errorLoggerUtils, 'errorLogger').callsFake(lastArg);
        sandbox.stub(errorLoggerUtils, 'ctxErrorLogger').callsFake(lastArg);
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
        const setIntervalStub = sinon
            .stub(defer, 'setDeferInterval')
            .returns(intervalId);
        const clearIntervalStub = sinon.stub(defer, 'clearDeferInterval');
        const directExistsStub = sinon
            .stub(direct, 'yaDirectExists')
            .returns(true as any);

        const title = 'title';
        const oldBrowserCtx: any = {
            location: { hash: '#', href: 'https://google.com' },
            document: { title },
        };
        const counterOptions: any = {
            counterId: 123,
            counterType: '0',
            trackHash: true,
            ut: true,
        };
        const result = useTrackHash(oldBrowserCtx, counterOptions);

        const [ctx, callback, timeout] = setIntervalStub.getCall(0).args;
        chai.expect(ctx).to.equal(oldBrowserCtx);
        chai.expect(timeout).to.equal(HASH_CHECKS_INTERVAL);
        chai.expect(senderStub.called).to.be.false;
        oldBrowserCtx.location.hash = '#hash?some-get-param=123';
        callback();

        const [senderOptions, counterOptionsCalled] =
            senderStub.getCall(0).args;
        chai.expect(senderOptions.brInfo.getVal(NOINDEX_BR_KEY)).to.equal('1');
        chai.expect(senderOptions.brInfo.getVal(PAGE_VIEW_BR_KEY)).to.equal(1);

        chai.expect(senderOptions.brInfo.getVal(AD_BR_KEY)).to.equal('1');
        chai.expect(senderOptions.brInfo.getVal(TRACK_HASH_BR_KEY)).to.equal(1);

        chai.expect(counterOptionsCalled).to.equal(counterOptions);
        chai.expect(senderOptions.urlParams).to.deep.equal({
            [WATCH_URL_PARAM]: 'https://google.com',
            [WATCH_REFERER_PARAM]: lastRef,
        });

        result[UNSUBSCRIBE_PROPERTY]();
        chai.expect(clearIntervalStub.calledWith(oldBrowserCtx, intervalId)).to
            .be.true;

        setIntervalStub.restore();
        clearIntervalStub.restore();
        directExistsStub.restore();
    });

    it('works correctly in new browser and trackHash is working', () => {
        const unsubscribeCallback = sinon.stub();
        const eventsHandler = {
            on: sinon.stub().returns(unsubscribeCallback),
        } as any;
        const eventsStub = sandbox
            .stub(events, 'cEvent')
            .returns(eventsHandler);
        const directExistsStub = sinon
            .stub(direct, 'yaDirectExists')
            .returns(false as any);

        const title = 'title';
        const newBrowserCtx: any = {
            onhashchange: () => {},
            location: { hash: '#', href: 'https://google.com' },
            document: { title },
        };
        const counterOptions: any = {
            counterId: 123,
            counterType: '0',
        };
        const { trackHash } = useTrackHash(newBrowserCtx, counterOptions);

        chai.expect(eventsHandler.on.called).to.be.false;
        trackHash(true);
        const [ctx, eventName, callback] = eventsHandler.on.getCall(0).args;
        chai.expect(ctx).to.equal(newBrowserCtx);
        chai.expect(eventName).to.deep.equal(['hashchange']);
        chai.expect(senderStub.called).to.be.false;

        callback();

        trackHash(false);
        const [senderOptions, counterOptionsCalled] =
            senderStub.getCall(0).args;
        chai.expect(senderOptions.brInfo.getVal(PAGE_VIEW_BR_KEY)).to.equal(1);
        chai.expect(senderOptions.brInfo.getVal(TRACK_HASH_BR_KEY)).to.equal(1);

        chai.expect(counterOptionsCalled).to.equal(counterOptions);
        chai.expect(senderOptions.urlParams).to.deep.equal({
            [WATCH_URL_PARAM]: 'https://google.com',
            [WATCH_REFERER_PARAM]: lastRef,
        });

        directExistsStub.restore();
        eventsStub.restore();
    });

    it('sets counter state', () => {
        const ctxStub: any = {
            onhashchange: () => {},
            location: { hash: '#', href: 'https://google.com' },
            document: { title: 'title' },
        };
        const { trackHash } = useTrackHash(ctxStub, {
            trackHash: undefined,
        } as any);
        chai.expect(counterStateStub.getCalls().length).to.eq(0);

        trackHash(false);
        verifyCounterStateCall(0, false);

        trackHash(true);
        verifyCounterStateCall(1, true);
    });
});
