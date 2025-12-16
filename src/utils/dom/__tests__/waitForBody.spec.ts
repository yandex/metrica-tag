import * as sinon from 'sinon';
import * as defer from 'src/utils/defer/defer';
import { noop } from 'src/utils/function/noop';
import { taskFork } from 'src/utils/async/task';
import { waitForBodyTask, TIMEOUT_FOR_BODY } from '../waitForBody';

describe('waitForBody', () => {
    const sandbox = sinon.createSandbox();
    let setDeferStub: sinon.SinonStub<
        Parameters<typeof defer.setDefer>,
        ReturnType<typeof defer.setDefer>
    >;

    beforeEach(() => {
        setDeferStub = sandbox.stub(defer, 'setDefer');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('waits for body', (done) => {
        const ctx = {
            document: {},
        } as Window;
        waitForBodyTask(ctx)(taskFork(noop, done));

        sinon.assert.calledOnceWithExactly(
            setDeferStub,
            ctx,
            sinon.match.func,
            TIMEOUT_FOR_BODY,
        );
        ctx.document.body = {} as HTMLElement;
        setDeferStub.yield();
    });

    it('waits for body for the iframe', (done) => {
        const ctx = {} as Window;
        const src = 'https://example.com';
        const targetIframe = {
            nodeType: 1,
            contentWindow: {
                document: {
                    body: {},
                },
            },
            src,
            contentDocument: {
                URL: src,
            },
        } as HTMLIFrameElement;

        waitForBodyTask(ctx, targetIframe)(taskFork(noop, done));

        sinon.assert.calledOnceWithExactly(
            setDeferStub,
            ctx,
            sinon.match.func,
            TIMEOUT_FOR_BODY,
        );
        setDeferStub.yield();
    });
});
