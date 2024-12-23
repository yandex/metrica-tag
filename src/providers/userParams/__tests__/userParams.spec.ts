import * as chai from 'chai';
import * as sinon from 'sinon';
import * as dConsole from 'src/providers/debugConsole/debugConsole';
import { METHOD_NAME_PARAMS, ParamsHandler } from 'src/providers/params/const';
import * as counter from 'src/utils/counter/getInstance';
import { CounterOptions } from 'src/utils/counterOptions';
import * as errorLoggerUtils from 'src/utils/errorLogger/errorLogger';
import { noop } from 'src/utils/function/noop';
import { CounterObject } from 'src/utils/counter/type';
import { rawUserParams as userParams } from '../userParams';
import { METHOD_NAME_USER_PARAMS } from '../const';

describe('user params', () => {
    const counterOptions: CounterOptions = {
        id: 10,
        counterType: '0',
    };
    const paramsCalledErrorMessage = 'params should not have been called';
    const callbackStub = () => {};
    const windowStub = {} as unknown as Window;
    const stubData = { a: { b: 'c' } };
    const stubExpectedData = { __ymu: { a: { b: 'c' } } };

    const sandbox = sinon.createSandbox();

    beforeEach(() => {
        sandbox.stub(dConsole, 'DebugConsole').returns({
            warn: () => {
                // do nothing
            },
        } as any);
        sandbox
            .stub(errorLoggerUtils, 'errorLogger')
            .callsFake((ctx, scopeName, fn) => (...args) => {
                const callback = fn || (() => {});
                return callback(...args);
            });
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('calls params', (done) => {
        const counterInstanceStub = sandbox.stub(counter, 'getCounterInstance');

        counterInstanceStub.returns({
            [METHOD_NAME_PARAMS]: ((data, callback) => {
                const message = "Doesn't call params with the right arguments";

                chai.expect(data, message).to.deep.equal(stubExpectedData);
                chai.expect(callback, message).to.equal(callbackStub);

                done();
            }) as ParamsHandler,
        } as unknown as CounterObject);

        const provider = userParams(windowStub, counterOptions);
        provider[METHOD_NAME_USER_PARAMS](stubData, callbackStub);
    });

    it("doesn't fail if no counter instance exists", () => {
        const counterInstanceStub = sandbox.stub(counter, 'getCounterInstance');
        counterInstanceStub.returns(undefined);

        const provider = userParams(windowStub, counterOptions);
        provider[METHOD_NAME_USER_PARAMS](stubData, callbackStub);
    });

    it("doesn't call params if data isn't an object", () => {
        const counterInstanceStub = sandbox.stub(counter, 'getCounterInstance');
        const localStubData = null;
        const paramsStub = sinon.fake();

        counterInstanceStub.returns({
            [METHOD_NAME_PARAMS]: paramsStub,
        } as unknown as CounterObject);

        const provider = userParams(windowStub, counterOptions);
        provider[METHOD_NAME_USER_PARAMS](localStubData, callbackStub);

        chai.expect(paramsStub.callCount, paramsCalledErrorMessage).to.equal(0);
    });

    it('should call params with noop if no callback is specified', (done) => {
        const counterInstanceStub = sandbox.stub(counter, 'getCounterInstance');
        counterInstanceStub.returns({
            [METHOD_NAME_PARAMS]: ((data, callback) => {
                chai.expect(data).to.deep.equal(stubExpectedData);
                chai.expect(callback).to.equal(noop);
                done();
            }) as ParamsHandler,
        } as unknown as CounterObject);

        const provider = userParams(windowStub, counterOptions);
        provider[METHOD_NAME_USER_PARAMS](stubData);
    });

    it('should pass 3rd argument ( ctx ) to params', (done) => {
        const counterInstanceStub = sandbox.stub(counter, 'getCounterInstance');
        const callbackCtxStub = {};

        counterInstanceStub.returns({
            [METHOD_NAME_PARAMS]: ((data, callback, callbackCtx) => {
                chai.expect(data).to.deep.equal(stubExpectedData);
                chai.expect(callback).to.equal(callbackStub);
                chai.expect(callbackCtx).to.equal(callbackCtxStub);
                done();
            }) as ParamsHandler,
        } as unknown as CounterObject);

        const provider = userParams(windowStub, counterOptions);
        provider[METHOD_NAME_USER_PARAMS](
            stubData,
            callbackStub,
            callbackCtxStub,
        );
    });

    it('should pass undefined as 3rd argument to params if no callbackCtx provided', (done) => {
        const counterInstanceStub = sandbox.stub(counter, 'getCounterInstance');
        counterInstanceStub.returns({
            [METHOD_NAME_PARAMS]: function a(data, callback, callbackCtx) {
                chai.expect(data).to.deep.equal(stubExpectedData);
                chai.expect(callback).to.equal(callbackStub);
                chai.expect(callbackCtx).to.equal(undefined);
                chai.expect(arguments.length).to.equal(3);
                done();
            } as ParamsHandler,
        } as unknown as CounterObject);

        const provider = userParams(windowStub, counterOptions);
        provider[METHOD_NAME_USER_PARAMS](stubData, callbackStub);
    });
});
