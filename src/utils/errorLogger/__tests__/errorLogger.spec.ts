import * as sinon from 'sinon';
import * as isNativeFunctionUtils from 'src/utils/function/isNativeFunction/isNativeFunction';
import * as getNativeFunctionUtils from 'src/utils/function/isNativeFunction/getNativeFunction';
import * as flags from '@inject';
import {
    DEBUG_FEATURE,
    DEBUG_CONSOLE_FEATURE,
    LOCAL_FEATURE,
    PREPROD_FEATURE,
    EXPERIMENTAL_FEATURE,
} from 'generated/features';
import { JSDOMWrapper } from 'src/__tests__/utils/jsdom';
import * as execTimeErrDecorator from '../executionTimeErrorDecorator';
import { errorLogger } from '../errorLogger';
import { IGNORED_ERRORS, KNOWN_ERROR } from '../consts';
import * as onError from '../onError';

describe('errorLogger', () => {
    const locationHref = 'https://test.com/';
    const errorMessage = 'nice function!';
    const scope = 'testScope';
    const sandbox = sinon.createSandbox();
    const err = new Error(errorMessage);
    const fn = () => {
        throw err;
    };
    let timesCalled = 0;
    let executionTime = 100;
    const { window } = new JSDOMWrapper(undefined, { url: locationHref });
    window.performance.now = () => {
        timesCalled += 1;
        return executionTime * timesCalled;
    };
    const jsErrsKey = 'jserrs';

    let getNativeFunctionStub: sinon.SinonStub<
        [functionName: string, owner: any],
        any
    >;
    let isNativeFunctionStub: sinon.SinonStub<
        Parameters<typeof isNativeFunctionUtils.isNativeFunction>,
        ReturnType<typeof isNativeFunctionUtils.isNativeFunction>
    >;
    let runCallbacksStub: sinon.SinonStub<
        [namespace: string, error: string, scope: string, stack?: string],
        void
    >;

    beforeEach(() => {
        sandbox.stub(flags, 'flags').value({
            [DEBUG_FEATURE]: false,
            [DEBUG_CONSOLE_FEATURE]: false,
            [LOCAL_FEATURE]: true,
            [PREPROD_FEATURE]: true,
            [EXPERIMENTAL_FEATURE]: true,
        });
        isNativeFunctionStub = sandbox.stub(
            isNativeFunctionUtils,
            'isNativeFunction',
        );
        isNativeFunctionStub.returns(true);
        getNativeFunctionStub = sandbox.stub(
            getNativeFunctionUtils,
            'getNativeFunction',
        );
        getNativeFunctionStub.returns(123);
        sandbox
            .stub(execTimeErrDecorator, 'executionTimeErrorDecorator')
            .callsFake((f, scopeName, ctx, callContext?) => {
                return f.bind(callContext);
            });
        runCallbacksStub = sandbox.stub(onError, 'runOnErrorCallbacks');
    });

    afterEach(() => {
        timesCalled = 0;
        executionTime = 100;
        sandbox.restore();
    });

    it('calls the runCallbacks function', () => {
        const catchFn = errorLogger(window, scope, fn, undefined, null);
        catchFn();
        sinon.assert.calledOnceWithExactly(
            runCallbacksStub,
            jsErrsKey,
            errorMessage,
            scope,
            err.stack!.replace(/\n/g, '\\n'),
        );
    });

    describe('execution-time decorator gating', () => {
        const noop = () => {};

        const setFlags = (overrides: Record<string, boolean>) => {
            sandbox.stub(flags, 'flags').value({
                [DEBUG_FEATURE]: false,
                [DEBUG_CONSOLE_FEATURE]: false,
                [LOCAL_FEATURE]: true,
                [PREPROD_FEATURE]: false,
                [EXPERIMENTAL_FEATURE]: false,
                ...overrides,
            });
        };

        beforeEach(() => {
            sandbox.restore();
            sandbox
                .stub(execTimeErrDecorator, 'executionTimeErrorDecorator')
                .callsFake((f, scopeName, ctx, callContext?) => {
                    return f.bind(callContext);
                });
        });

        it('does not wrap with timing when no timing flag is enabled', () => {
            setFlags({});
            errorLogger(window, scope, noop);
            sinon.assert.notCalled(
                execTimeErrDecorator.executionTimeErrorDecorator as sinon.SinonStub,
            );
        });

        it('wraps with timing when PREPROD_FEATURE is enabled regardless of extraTimingFlag', () => {
            setFlags({ [PREPROD_FEATURE]: true });
            errorLogger(window, scope, noop, undefined, null, false);
            sinon.assert.calledOnce(
                execTimeErrDecorator.executionTimeErrorDecorator as sinon.SinonStub,
            );
        });

        it('wraps with timing when extraTimingFlag is true', () => {
            setFlags({});
            errorLogger(window, scope, noop, undefined, null, true);
            sinon.assert.calledOnce(
                execTimeErrDecorator.executionTimeErrorDecorator as sinon.SinonStub,
            );
        });

        it('does not wrap with timing when extraTimingFlag is false', () => {
            setFlags({});
            errorLogger(window, scope, noop, undefined, null, false);
            sinon.assert.notCalled(
                execTimeErrDecorator.executionTimeErrorDecorator as sinon.SinonStub,
            );
        });
    });

    it('ignore specific errors and KNOWN ERROR', () => {
        IGNORED_ERRORS.forEach((error) => {
            const catchFn = errorLogger(
                window,
                scope,
                () => {
                    throw new Error(
                        `a horrible ${error} error occurred by using your code`,
                    );
                },
                undefined,
                null,
            );
            catchFn();
        });

        const catchFn = errorLogger(
            window,
            scope,
            () => {
                throw new Error(KNOWN_ERROR);
            },
            undefined,
            null,
        );
        catchFn();

        sinon.assert.notCalled(runCallbacksStub);
    });
});
