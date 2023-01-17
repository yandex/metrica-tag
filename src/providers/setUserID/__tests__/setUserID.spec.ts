import * as chai from 'chai';
import * as sinon from 'sinon';
import * as counter from 'src/utils/counter';
import * as errorLoggerUtils from 'src/utils/errorLogger';
import { METHOD_NAME_PARAMS } from 'src/providers/params/const';
import { CounterOptions } from 'src/utils/counterOptions';
import { noop } from 'src/utils/function';
import { rawSetUserID as setUserID } from '../setUserID';

describe('user params', () => {
    const windowStub = {
        /* eslint-disable no-restricted-globals */
        isFinite,
        isNaN,
        /* eslint-enable no-restricted-globals */
        console: {
            error: () => {},
        },
    } as any;
    const counterOptions: CounterOptions = {
        id: 10,
        counterType: '0',
    };
    const paramsErrorMessage = "Doesn't call params with the right arguments";
    const mockUserId = 1234;
    const mockExpectedData = {
        __ym: {
            ['user_id']: mockUserId,
        },
    };
    const mockCallback = () => {};
    const mockCallbackCtx = {};
    const paramsNotCalledErrorMessage =
        "counterInstance.params() wasn't called";

    let errorLoggerStub: any;
    let counterInstanceStub: any;

    beforeEach(() => {
        counterInstanceStub = sinon.stub(counter, 'getCounterInstance');
        errorLoggerStub = sinon
            .stub(errorLoggerUtils, 'errorLogger')
            .callsFake((ctx, scopeName, fn) => (...args) => {
                const callback = fn || (() => {});
                return callback(...args);
            });
    });

    afterEach(() => {
        errorLoggerStub.restore();
        counterInstanceStub.restore && counterInstanceStub.restore();
    });

    it('calls params', () => {
        const paramsStub = sinon.stub().callsFake((data, callback, ctx) => {
            chai.expect(data, paramsErrorMessage).to.deep.equal(
                mockExpectedData,
            );
            chai.expect(callback, paramsErrorMessage).to.equal(mockCallback);
            chai.expect(ctx, paramsErrorMessage).to.equal(mockCallbackCtx);
        });
        counterInstanceStub.returns({
            [METHOD_NAME_PARAMS]: paramsStub,
        } as any);

        const provider = setUserID(windowStub, counterOptions);
        provider.setUserID(mockUserId, mockCallback, mockCallbackCtx);

        chai.expect(paramsStub.called, paramsNotCalledErrorMessage).to.be.true;
    });

    it("doesn't call params if id is of the wrong format", () => {
        const paramsStub = sinon.fake();
        counterInstanceStub.returns({
            [METHOD_NAME_PARAMS]: paramsStub,
        } as any);

        const provider = setUserID(windowStub, counterOptions);
        const invalidUserID = {
            valueOf() {
                return 1234;
            },
        };

        provider.setUserID(invalidUserID, mockCallback, mockCallbackCtx);
        chai.expect(
            paramsStub.called,
            "counterInstance.params() shoudln't have been called",
        ).to.be.false;
    });

    it('calls params with noop if no callback provided', () => {
        const paramsStub = sinon.stub().callsFake((data, callback) => {
            chai.expect(data, paramsErrorMessage).to.deep.equal(
                mockExpectedData,
            );
            chai.expect(callback, 'should have passed noop to params').to.equal(
                noop,
            );
        });
        counterInstanceStub.returns({
            [METHOD_NAME_PARAMS]: paramsStub,
        } as any);

        const provider = setUserID(windowStub, counterOptions);
        provider.setUserID(mockUserId);
        chai.expect(paramsStub.called, paramsNotCalledErrorMessage).to.be.true;
    });

    it('calls params with undefined as 3rd argument if no callbackCtx provided', () => {
        const paramsStub = sinon.stub().callsFake((...args) => {
            chai.expect(
                args.length,
                'Should have passed 3 arguments to params',
            ).to.equal(3);
            const [data, callback, callbackCtx] = args;
            chai.expect(data, paramsErrorMessage).to.deep.equal(
                mockExpectedData,
            );
            chai.expect(callback, paramsErrorMessage).to.equal(mockCallback);
            chai.expect(callbackCtx).to.equal(undefined);
        });
        counterInstanceStub.returns({
            [METHOD_NAME_PARAMS]: paramsStub,
        } as any);

        const provider = setUserID(windowStub, counterOptions);
        provider.setUserID(mockUserId, mockCallback);
        chai.expect(paramsStub.called, paramsNotCalledErrorMessage).to.be.true;
    });
});
