import * as chai from 'chai';
import * as sinon from 'sinon';
import * as defer from 'src/utils/defer';
import { noop } from 'src/utils/function';
import { taskFork } from 'src/utils/async';
import { waitForBodyTask, TIMEOUT_FOR_BODY } from '../waitForBody';

describe('waitForBody', () => {
    const sandbox = sinon.createSandbox();
    let setDeferStub: sinon.SinonStub<any, any>;

    beforeEach(() => {
        setDeferStub = sandbox.stub(defer, 'setDefer');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('waits for body', (done) => {
        const ctx: any = {
            document: {},
        };
        waitForBodyTask(ctx)(taskFork(noop, done));

        const [deferCtx, callback, timeout] = setDeferStub.getCall(0).args;
        chai.expect(timeout).to.equal(TIMEOUT_FOR_BODY);
        chai.expect(deferCtx).to.equal(ctx);

        ctx.document.body = {};
        callback();
    });

    it('waits for body for the iframe', (done) => {
        const ctx = {} as any;
        const targetIframe: any = {
            nodeType: 1,
        };

        waitForBodyTask(ctx, targetIframe)(taskFork(noop, done));

        const [deferCtx, callback, timeout] = setDeferStub.getCall(0).args;
        chai.expect(timeout).to.equal(TIMEOUT_FOR_BODY);
        chai.expect(deferCtx).to.equal(ctx);

        targetIframe.contentWindow = {
            document: {
                body: {},
            },
        };
        callback();
    });
});
