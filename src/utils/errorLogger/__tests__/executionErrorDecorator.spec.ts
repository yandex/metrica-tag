import * as sinon from 'sinon';
import * as chai from 'chai';
import * as func from 'src/utils/function/isNativeFunction/isNativeFunction';
import * as onError from '../onError';
import * as decorator from '../executionTimeErrorDecorator';
import { getExecutionTimingBuffer } from '../executionTimingBuffer';
import {
    EXECUTION_TIMING_SAMPLING_RATE,
    TOO_LONG_ERROR_NAME,
    TOO_LONG_FUNCTION_EXECUTION,
} from '../consts';

const { executionTimeErrorDecorator, getMainThreadBlockingTime } = decorator;
describe('executionTimeErrorDecorator', () => {
    let ctx = {
        location: {
            href: 'http://example.com',
        },
    } as Window;
    const callCtx = {};
    const sandbox = sinon.createSandbox();
    let performanceStub: sinon.SinonStub<
        Parameters<typeof window.performance.now>,
        ReturnType<typeof window.performance.now>
    >;
    let runOnErrorCallbacks: sinon.SinonStub<
        Parameters<typeof onError.runOnErrorCallbacks>,
        ReturnType<typeof onError.runOnErrorCallbacks>
    >;
    let randomStub: sinon.SinonStub<
        Parameters<typeof Math.random>,
        ReturnType<typeof Math.random>
    >;

    const arg1 = 'a';
    const arg2 = 'b';
    const arg3 = 'c';

    beforeEach(() => {
        performanceStub = sandbox
            .stub<
                Parameters<typeof window.performance.now>,
                ReturnType<typeof window.performance.now>
            >()
            .returns(0);
        randomStub = sandbox
            .stub<
                Parameters<typeof Math.random>,
                ReturnType<typeof Math.random>
            >()
            .returns(EXECUTION_TIMING_SAMPLING_RATE / 2);
        ctx = {
            ...ctx,
            performance: {
                now: performanceStub,
            } as unknown as Performance,
            Math: {
                random: randomStub,
            } as unknown as Math,
        };
        sandbox.stub(func, 'isNativeFunction').returns(true);
        runOnErrorCallbacks = sandbox.stub(onError, 'runOnErrorCallbacks');
        getExecutionTimingBuffer().flush();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('throws errors if callback function does the same', () => {
        performanceStub.returns(0);
        const error = new Error('I am an error');
        const cb = sinon.stub().throws(error);
        const decorated = executionTimeErrorDecorator(cb, 'some', ctx, callCtx);
        chai.expect(() => decorated(arg1, arg2, arg3)).throws(error);
        sinon.assert.calledOnceWithExactly(cb, arg1, arg2, arg3);
        sinon.assert.calledOn(cb, callCtx);
        sinon.assert.notCalled(runOnErrorCallbacks);
    });

    it('reports timeout exceedee only on the lowest level', () => {
        const ns1 = 'wrongNs';
        const ns2 = 'correctNs';
        const ns3 = 'anotherWrongNs';

        let timesCalled = 0;
        let accumulatedTime = 0;
        const resultTime = TOO_LONG_FUNCTION_EXECUTION * 100;
        performanceStub.callsFake(() => {
            timesCalled += 1;

            // Грубо говоря коллбэк номер 2 выполнялся больше секунды
            if (timesCalled === 5) {
                accumulatedTime = resultTime;
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
            `${resultTime}`,
        );
        chai.expect(getMainThreadBlockingTime()).to.equal(
            TOO_LONG_FUNCTION_EXECUTION * 100,
        );
    });

    it("doesn't report OK timeout", () => {
        let timesCalled = 0;
        performanceStub.callsFake(() => {
            timesCalled += 1;
            return timesCalled * (TOO_LONG_FUNCTION_EXECUTION / 2) - 1;
        });
        const cb = sinon.stub();
        const decorated = executionTimeErrorDecorator(cb, 'some', ctx, callCtx);
        decorated(arg1, arg2, arg3);
        sinon.assert.calledOnceWithExactly(cb, arg1, arg2, arg3);
        sinon.assert.calledOn(cb, callCtx);
        sinon.assert.notCalled(runOnErrorCallbacks);
    });

    it('pushes a timing sample for a function over the sample threshold but below the error threshold', () => {
        performanceStub.onFirstCall().returns(0);
        performanceStub.onSecondCall().returns(60);
        const cb = sinon.stub();
        const decorated = executionTimeErrorDecorator(
            cb,
            'sampleScope',
            ctx,
            callCtx,
        );
        decorated(arg1, arg2, arg3);

        chai.expect(getExecutionTimingBuffer().slice()).to.deep.equal([
            { scope: 'sampleScope', startTime: 0, endTime: 60 },
        ]);
        sinon.assert.notCalled(runOnErrorCallbacks);
    });

    it('does not push a timing sample for a function below the sample threshold', () => {
        performanceStub.onFirstCall().returns(0);
        performanceStub.onSecondCall().returns(40);
        const cb = sinon.stub();
        const decorated = executionTimeErrorDecorator(
            cb,
            'sampleScope',
            ctx,
            callCtx,
        );
        decorated(arg1, arg2, arg3);

        chai.expect(getExecutionTimingBuffer().slice()).to.have.length(0);
        sinon.assert.notCalled(runOnErrorCallbacks);
    });

    it('does not report an execution that falls outside the sample, but still buffers its timing', () => {
        randomStub.returns(EXECUTION_TIMING_SAMPLING_RATE);
        performanceStub.onFirstCall().returns(0);
        performanceStub.onSecondCall().returns(TOO_LONG_FUNCTION_EXECUTION);
        const decorated = executionTimeErrorDecorator(
            sinon.stub(),
            'sampleScope',
            ctx,
            callCtx,
        );
        decorated(arg1, arg2, arg3);

        sinon.assert.notCalled(runOnErrorCallbacks);
        chai.expect(getExecutionTimingBuffer().slice()).to.deep.equal([
            {
                scope: 'sampleScope',
                startTime: 0,
                endTime: TOO_LONG_FUNCTION_EXECUTION,
            },
        ]);
    });

    it('suppresses the outer level even when the inner one falls outside the sample', () => {
        randomStub.onFirstCall().returns(EXECUTION_TIMING_SAMPLING_RATE);
        randomStub.returns(EXECUTION_TIMING_SAMPLING_RATE / 2);
        performanceStub.onCall(0).returns(0);
        performanceStub.onCall(1).returns(0);
        performanceStub.onCall(2).returns(TOO_LONG_FUNCTION_EXECUTION);
        performanceStub.onCall(3).returns(TOO_LONG_FUNCTION_EXECUTION);

        executionTimeErrorDecorator(
            () => {
                executionTimeErrorDecorator(
                    () => {
                        // do nothing
                    },
                    'innerNs',
                    ctx,
                    callCtx,
                )();
            },
            'outerNs',
            ctx,
            callCtx,
        )();

        sinon.assert.calledOnce(randomStub);
        sinon.assert.notCalled(runOnErrorCallbacks);
    });
});
