import * as chai from 'chai';
import * as sinon from 'sinon';
import * as DOM from 'src/utils/dom/dom';
import * as defer from 'src/utils/defer/defer';
import { useTriggerEvent } from '../triggerEvent';

describe('Trigger event provider', () => {
    let createAndDispatchEventMock: sinon.SinonStub;
    let utilsMock: sinon.SinonStub;

    beforeEach(() => {
        createAndDispatchEventMock = sinon.stub(DOM, 'createAndDispatchEvent');
        utilsMock = sinon.stub(defer, 'setDefer').callsFake((ctx, cb) => {
            cb();
            return 1;
        });
    });

    afterEach(() => {
        createAndDispatchEventMock.restore();
        utilsMock.restore();
    });

    it('does nothing if triggerEvent is false', () => {
        const counterOptions: any = { id: 100, triggerEvent: false };
        useTriggerEvent({} as any, counterOptions);
        chai.expect(createAndDispatchEventMock.calledOnce).to.be.false;
        chai.expect(utilsMock.notCalled).to.be.true;
    });

    it('dispatches event if triggerEvent is true', () => {
        const ctx: any = {};
        const counterOptions: any = { id: 100, triggerEvent: true };
        useTriggerEvent(ctx, counterOptions);

        const [ctxCalled, eventName] =
            createAndDispatchEventMock.getCall(0).args;
        chai.expect(ctxCalled).to.equal(ctx);
        chai.expect(eventName).to.equal(`yacounter${counterOptions.id}inited`);
        chai.expect(utilsMock.calledOnce).to.be.true;
    });
});
