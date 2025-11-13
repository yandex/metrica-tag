import * as chai from 'chai';
import * as sinon from 'sinon';
import { PRERENDER_MW_BR_KEY } from 'src/api/watch';
import * as eventUtils from 'src/utils/events/events';
import { browserInfo } from 'src/utils/browserInfo/browserInfo';
import { CounterOptions } from 'src/utils/counterOptions';
import { prerender } from '../prerender';

describe('Prerender', () => {
    let eventsStub: any;
    const onSpy = sinon.spy();
    const unSpy = sinon.spy();

    beforeEach(() => {
        eventsStub = sinon.stub(eventUtils, 'cEvent').returns({
            on: onSpy,
            un: unSpy,
        } as any);
    });

    afterEach(() => {
        onSpy.resetHistory();
        unSpy.resetHistory();
        eventsStub.restore();
    });

    it('pass if not prerendering', () => {
        const next = sinon.spy();
        const ctx = { document: { prerendering: false } } as Window;
        const counterOptions: CounterOptions = {
            id: 1,
            counterType: '1',
        };
        const middleware = prerender(ctx, counterOptions);

        middleware.beforeRequest!({ brInfo: browserInfo() }, next);
        sinon.assert.calledOnce(next);
    });

    it('pass if visibilitystate null', () => {
        const next = sinon.spy();
        const ctx = {
            document: {},
        } as Window;
        const counterOptions: CounterOptions = {
            id: 1,
            counterType: '1',
        };
        const middleware = prerender(ctx, counterOptions);

        middleware.beforeRequest!({ brInfo: browserInfo() }, next);
        sinon.assert.calledOnce(next);
    });

    it('do nothing if empty brInfo just pass', () => {
        const win = {
            document: { visibilityState: 'prerender' },
        } as unknown as Window;
        const counterOptions: CounterOptions = { id: 1, counterType: '1' };
        const next = sinon.spy();
        const middleware = prerender(win, counterOptions);

        middleware.beforeRequest!({}, next);
        sinon.assert.calledOnce(next);
    });

    it('waits for visibility state not prerender', () => {
        const next = sinon.spy();
        const ctx = { document: { prerendering: true } } as Window;
        const senderParams = {
            brInfo: browserInfo({}),
        };
        const middleware = prerender(ctx, {
            id: 1,
            counterType: '1',
        });
        middleware.beforeRequest!(senderParams, next);
        sinon.assert.calledOnceWithExactly(
            onSpy,
            ctx.document,
            [
                'webkitvisibilitychange',
                'visibilitychange',
                'prerenderingchange',
            ],
            sinon.match.func,
        );
        sinon.assert.notCalled(next);
        // @ts-expect-error -- mutating readonly property to simulate transition
        ctx.document.prerendering = false;

        onSpy.firstCall.yield({});
        sinon.assert.calledOnce(next);
        sinon.assert.calledOnceWithExactly(
            unSpy,
            ctx.document,
            [
                'webkitvisibilitychange',
                'visibilitychange',
                'prerenderingchange',
            ],
            sinon.match.func,
        );
        sinon.assert.calledOnce(next);
        chai.expect(
            senderParams.brInfo.getVal(PRERENDER_MW_BR_KEY),
        ).to.be.equal('1');
    });
});
