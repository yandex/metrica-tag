import { CounterOptions } from 'src/utils/counterOptions';
import * as sinon from 'sinon';
import * as browserUtils from 'src/utils/browser/browser';
import * as deferUtils from 'src/utils/defer/defer';
import * as frameConnectorUtils from 'src/utils/iframeConnector/iframeConnector';
import { emitter } from 'src/utils/events/emitter';
import {
    EventInfo,
    IframeConnector,
    INIT_MESSAGE_CHILD,
} from 'src/utils/iframeConnector';
import { waitParentDuid } from '../waitParentDuid';

describe('wait for parent duid', () => {
    const sandbox = sinon.createSandbox();

    afterEach(() => {
        sandbox.restore();
    });

    function makeStubs({
        isTP,
        isIframe,
    }: {
        isTP: boolean;
        isIframe: boolean;
    }) {
        sandbox.stub(browserUtils, 'isTP').returns(isTP);
        sandbox.stub(browserUtils, 'isIframe').returns(isIframe);

        const next = sandbox.stub();
        const opt: CounterOptions = {
            id: Math.random() * 100,
            counterType: '0',
        };

        const ctx = {} as Window;
        const iframeConnector = {
            emitter: emitter<EventInfo, void>(ctx),
        };
        sandbox
            .stub(frameConnectorUtils, 'counterIframeConnector')
            .returns(iframeConnector as IframeConnector);

        const defer = sandbox.stub(deferUtils, 'setDefer').returns(1);

        return { next, ctx, opt, iframeConnector, defer };
    }

    it('not activates not in frame', () => {
        const { next, ctx, opt } = makeStubs({ isTP: true, isIframe: false });

        waitParentDuid(ctx, opt, next);
        sinon.assert.calledOnce(next);
    });

    it('not activates not ITP', () => {
        const { next, ctx, opt } = makeStubs({ isTP: false, isIframe: true });

        waitParentDuid(ctx, opt, next);
        sinon.assert.calledOnce(next);
    });

    it('delays hits for frame init', () => {
        const { next, ctx, opt, iframeConnector } = makeStubs({
            isTP: true,
            isIframe: true,
        });

        waitParentDuid(ctx, opt, next);
        sinon.assert.notCalled(next);

        iframeConnector.emitter.trigger(INIT_MESSAGE_CHILD);
        sinon.assert.calledOnce(next);
    });

    it('delays hits for timeout', () => {
        const { next, ctx, opt, defer } = makeStubs({
            isTP: true,
            isIframe: true,
        });

        waitParentDuid(ctx, opt, next);
        sinon.assert.notCalled(next);
        defer.getCall(0).args[1]();
        sinon.assert.calledOnce(next);
    });
});
