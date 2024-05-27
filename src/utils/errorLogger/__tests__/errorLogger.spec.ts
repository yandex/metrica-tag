import * as sinon from 'sinon';
import * as functionUtils from 'src/utils/function';
import * as flags from '@inject';
import {
    DEBUG_FEATURE,
    DEBUG_CONSOLE_FEATURE,
    LOCAL_FEATURE,
    PREPROD_FEATURE,
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
        Parameters<typeof functionUtils.isNativeFunction>,
        ReturnType<typeof functionUtils.isNativeFunction>
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
        });
        isNativeFunctionStub = sandbox.stub(functionUtils, 'isNativeFunction');
        isNativeFunctionStub.returns(true);
        getNativeFunctionStub = sandbox.stub(
            functionUtils,
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
