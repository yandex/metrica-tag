import * as chai from 'chai';
import * as sinon from 'sinon';
import * as events from 'src/utils/events';
import * as defer from 'src/utils/defer';
import * as numberUtils from 'src/utils/number';
import * as errorLoggerUtils from 'src/utils/errorLogger';
import { JSDOMWrapper } from 'src/__tests__/utils/jsdom';
import { runAsync } from '..';

describe('Async test', () => {
    describe('runAsync', () => {
        const sandbox = sinon.createSandbox();
        let postMessage: sinon.SinonStub;
        let eventHandlerUnsubscribe: sinon.SinonStub;
        let eventHandlerOn: sinon.SinonStub;
        let eventHandlerUn: sinon.SinonStub;
        let randomCount = 0;

        beforeEach(() => {
            postMessage = sandbox.stub();
            eventHandlerUnsubscribe = sandbox
                .stub()
                .named('eventHandlerUnsubscribe');
            eventHandlerOn = sandbox.stub().returns(eventHandlerUnsubscribe);
            eventHandlerUn = sandbox.stub();
            sandbox.stub(events, 'cEvent').returns({
                on: eventHandlerOn,
                un: eventHandlerUn,
            });

            sandbox.stub(numberUtils, 'getRandom').callsFake(() => {
                randomCount += 1;
                return randomCount;
            });

            sandbox
                .stub(errorLoggerUtils, 'errorLogger')
                .callsFake((ctx, scope, fn) => {
                    return (...args) => {
                        try {
                            fn!(...args);
                        } catch {}
                    };
                });
        });

        afterEach(() => {
            sandbox.restore();
            sandbox.reset();
        });

        it('calls postMessage', () => {
            const ctx = {
                postMessage,
            } as unknown as Window;

            runAsync(ctx, () => {});
            sinon.assert.callCount(postMessage, 1);
            sinon.assert.calledWith(
                postMessage,
                sinon.match(/^__ym__promise/),
                '*',
            );
        });
        it('calls postMessage with uniq messages', () => {
            const ctx = {
                postMessage,
            } as unknown as Window;

            runAsync(ctx, () => {});
            runAsync(ctx, () => {});

            chai.expect(postMessage.firstCall.args[0]).to.not.be.equal(
                postMessage.secondCall.args[0],
            );
        });
        it('calls setDefer if postMessage is unavailable', () => {
            const stub = sandbox.stub(defer, 'setDefer');
            const ctx = {} as unknown as Window;
            const cb = () => {};
            runAsync(ctx, cb);

            sinon.assert.calledWith(stub, ctx, cb, 0, sinon.match.any);
        });
        it('subscribes on message event', () => {
            const { window } = new JSDOMWrapper();
            runAsync(window, () => {});
            sinon.assert.callCount(eventHandlerOn, 1);
            const [target, evts, cb] = eventHandlerOn.getCall(0).args;
            chai.assert(typeof cb === 'function');
            chai.expect(target).to.equal(window);
            chai.expect(evts).to.deep.equal(['message']);
        });
        it('unsubscribe after callback call', () => {
            const ctx = {
                postMessage,
            } as unknown as Window;
            runAsync(ctx, () => {});

            // вручную вызываем onMessage с нужным сообщением
            eventHandlerOn.firstCall.args[2]({
                data: postMessage.firstCall.args[0],
            });
            sinon.assert.callCount(eventHandlerUnsubscribe, 1);
        });
        it('unsubscribe even if callback throws', () => {
            const ctx = {
                postMessage,
            } as unknown as Window;
            runAsync(ctx, () => {
                throw new Error('hey');
            });

            eventHandlerOn.firstCall.args[2]({
                data: postMessage.firstCall.args[0],
            });
            sinon.assert.callCount(eventHandlerUnsubscribe, 1);
        });
        it('ignore events with different message', () => {
            const ctx = {
                postMessage,
            } as unknown as Window;
            runAsync(ctx, () => {});

            eventHandlerOn.firstCall.args[2]({
                data: 'random_event_data',
            });
            sinon.assert.notCalled(eventHandlerUnsubscribe);
        });
    });
});
