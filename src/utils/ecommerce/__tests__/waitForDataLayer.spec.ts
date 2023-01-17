import * as sinon from 'sinon';
import * as dataL from 'src/utils/dataLayerObserver';
import type { DataLayerObserverObject } from 'src/utils/dataLayerObserver';
import * as defer from 'src/utils/defer';
import { waitForDataLayer } from '../waitForDataLayer';

describe('ecommerce', () => {
    describe('waitForDataLayer', () => {
        const dataLayerName = 'dl';
        const timeoutId = 123;

        const sandbox = sinon.createSandbox();
        const callbackSpy = sinon.spy();
        let setDeferStub: sinon.SinonStub<
            Parameters<typeof defer.setDefer>,
            ReturnType<typeof defer.setDefer>
        >;
        let clearDeferStub: sinon.SinonStub<
            Parameters<typeof defer.clearDefer>,
            ReturnType<typeof defer.clearDefer>
        >;
        let dataLayerObserverStub: sinon.SinonStub<
            Parameters<typeof dataL.dataLayerObserver>,
            ReturnType<typeof dataL.dataLayerObserver>
        >;

        beforeEach(() => {
            // sandbox.stub(numberUtils, 'isNumber').returns(true);
            setDeferStub = sandbox.stub(defer, 'setDefer').returns(timeoutId);
            clearDeferStub = sandbox.stub(defer, 'clearDefer');
            dataLayerObserverStub = sandbox
                .stub(dataL, 'dataLayerObserver')
                .returns({} as DataLayerObserverObject<unknown, unknown>);
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('waits for dataLayer to init', () => {
            const dataLayer: unknown[] = [];
            const ctx = {} as Window & Record<string, unknown>;

            // First try with no dataLayer
            waitForDataLayer(ctx, dataLayerName, callbackSpy);
            sinon.assert.notCalled(dataLayerObserverStub);
            sinon.assert.calledOnce(setDeferStub);

            // Second try with no dataLayer
            const [, firstDeferredCallback] = setDeferStub.getCall(0).args;
            firstDeferredCallback();
            sinon.assert.notCalled(dataLayerObserverStub);
            sinon.assert.calledTwice(setDeferStub);

            // A try with dataLayer that is not an array
            ctx[dataLayerName] = dataLayerName;
            const [, secondDeferredCallback] = setDeferStub.getCall(1).args;
            secondDeferredCallback();
            sinon.assert.notCalled(dataLayerObserverStub);
            sinon.assert.calledThrice(setDeferStub);

            // A try with dataLayer that is an array
            ctx[dataLayerName] = dataLayer;
            const [, thirdDeferredCallback] = setDeferStub.getCall(2).args;
            thirdDeferredCallback();
            sinon.assert.calledOnceWithExactly(
                dataLayerObserverStub,
                ctx,
                dataLayer,
                callbackSpy,
            );
            sinon.assert.calledThrice(setDeferStub);
        });

        it('stop waiting on unsubscribe function call', () => {
            const ctx = {} as Window & Record<string, unknown>;
            setDeferStub.returns(timeoutId);

            const unsubscribe = waitForDataLayer(
                ctx,
                dataLayerName,
                callbackSpy,
            );
            sinon.assert.notCalled(dataLayerObserverStub);
            sinon.assert.calledOnce(setDeferStub);

            unsubscribe();
            sinon.assert.calledOnceWithExactly(clearDeferStub, ctx, timeoutId);
        });
    });
});
