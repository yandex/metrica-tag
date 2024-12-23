import Sinon, * as sinon from 'sinon';
import * as chai from 'chai';
import * as random from 'src/utils/number/random';
import * as func from 'src/utils/function/isNativeFunction/isNativeFunction';
import * as onError from '../onError';
import * as decorator from '../executionTimeErrorDecorator';
import { TOO_LONG_ERROR_NAME, TOO_LONG_FUNCTION_EXECUTION } from '../consts';

const { executionTimeErrorDecorator, getMainThreadBlockingTime } = decorator;
describe('executionTimeErrorDecorator', () => {
    const ctx = {
        location: {
            href: 'http://example.com',
        },
        performance: {
            now: sinon.stub(),
        },
    } as any;
    const callCtx = {} as any;
    const sandbox = sinon.createSandbox();
    let runOnErrorCallbacks: Sinon.SinonStub<
        [namespace: string, error: string, scope: string, stack?: string]
    >;

    const arg1 = 'a';
    const arg2 = 'b';
    const arg3 = 'c';

    beforeEach(() => {
        sandbox.stub(func, 'isNativeFunction').returns(true);
        runOnErrorCallbacks = sandbox.stub(onError, 'runOnErrorCallbacks');
        sandbox.stub(random, 'getRandom').returns(1);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('throws errors if callback function does the same', () => {
        ctx.performance.now.returns(0);
        const error = new Error('I am an error');
        const cb = sinon.stub().throws(error);
        const decorated = executionTimeErrorDecorator(cb, 'some', ctx, callCtx);
        chai.expect(() => decorated(arg1, arg2, arg3)).throws(error);
        chai.assert(cb.called);
        chai.expect(cb.getCall(0).args).to.deep.equal([arg1, arg2, arg3]);
        chai.assert(cb.getCall(0).calledOn(callCtx));
        sinon.assert.notCalled(runOnErrorCallbacks);
    });

    it('reports timeout exceedee only on the lowest level', () => {
        const ns1 = 'wrongNs';
        const ns2 = 'correctNs';
        const ns3 = 'anotherWrongNs';

        let timesCalled = 0;
        let accumulatedTime = 0;
        ctx.performance.now.callsFake(() => {
            timesCalled += 1;

            // Грубо говоря коллбэк номер 2 выполнялся больше секунды
            if (timesCalled === 5) {
                accumulatedTime = TOO_LONG_FUNCTION_EXECUTION * 100;
            }

            return accumulatedTime;
        });
        executionTimeErrorDecorator(
            () => {
                executionTimeErrorDecorator(
                    () => {
                        executionTimeErrorDecorator(
                            () => {
                                // do nothing
                            },
                            ns3,
                            ctx,
                            callCtx,
                        )();
                    },
                    ns2,
                    ctx,
                    callCtx,
                )();
            },
            ns1,
            ctx,
            callCtx,
        )();

        sinon.assert.calledOnceWithExactly(
            runOnErrorCallbacks,
            'perf',
            TOO_LONG_ERROR_NAME,
            ns2,
        );
        chai.expect(getMainThreadBlockingTime()).to.equal(
            TOO_LONG_FUNCTION_EXECUTION * 100,
        );
    });

    it("doesn't report OK timeout", () => {
        let timesCalled = 0;
        ctx.performance.now.callsFake(() => {
            timesCalled += 1;
            return timesCalled * (TOO_LONG_FUNCTION_EXECUTION / 2) - 1;
        });
        const cb = sinon.stub();
        const decorated = executionTimeErrorDecorator(cb, 'some', ctx, callCtx);
        decorated(arg1, arg2, arg3);
        sinon.assert.calledOnceWithExactly(cb, arg1, arg2, arg3);
        chai.assert(cb.getCall(0).calledOn(callCtx));
        sinon.assert.notCalled(runOnErrorCallbacks);
    });
});
