import * as chai from 'chai';
import sinon from 'sinon';
import * as functionUtils from 'src/utils/function/isNativeFunction/isNativeFunction';
import * as getfunctionUtils from 'src/utils/function/isNativeFunction/getNativeFunction';
import { createAndDispatchEvent } from '../dom';

describe('dom / utils - createAndDispatchEvent', () => {
    const sandbox = sinon.createSandbox();
    let fakeInitEvent: any;
    let mockEventObj: any;
    let fakeDispatchEvent: sinon.SinonSpy;

    beforeEach(() => {
        fakeDispatchEvent = sandbox.spy();
        fakeInitEvent = sandbox.spy();
        mockEventObj = { initEvent: fakeInitEvent };
        sandbox
            .stub(functionUtils, 'isNativeFunction')
            .callsFake((name, val) => !!val);

        sandbox
            .stub(getfunctionUtils, 'getNativeFunction')
            .callsFake((name) => {
                const result = {
                    dispatchEvent: fakeDispatchEvent,
                    createEvent: () => mockEventObj,
                } as any;
                return result[name];
            });
    });
    afterEach(() => {
        sandbox.restore();
    });

    it('create and dispatch event if window.Event exist', () => {
        const eventName = 'test';
        const event = {};
        const fakeEventConstructor = sinon.stub().returns(event);
        window.Event = fakeEventConstructor as any;
        createAndDispatchEvent(window, eventName);

        chai.expect(fakeEventConstructor.calledWith(eventName)).to.be.true;
        chai.expect(fakeDispatchEvent.calledWith(event)).to.be.true;

        fakeEventConstructor.resetHistory();
    });

    it('create and dispatch event if window.Event = undefined', () => {
        const eventName = 'test';

        createAndDispatchEvent(window, eventName);

        chai.expect(fakeInitEvent.calledWith(eventName, false, false));
        chai.expect(fakeDispatchEvent.calledWith(mockEventObj));
    });
});
