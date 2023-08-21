import * as sinon from 'sinon';
import * as chai from 'chai';
import * as DC from 'src/providers/debugConsole/debugConsole';
import * as debugEnabled from 'src/providers/debugConsole/debugEnabled';
import * as dlObserver from 'src/utils/dataLayerObserver';
import type { DataLayerObserverObject } from 'src/utils/dataLayerObserver';
import { useReportNonNativeFunctionProviderRaw } from '../index';
import * as report from '../report';

describe('reportNonNativeFunction', () => {
    const sandbox = sinon.createSandbox();
    let observerStub: sinon.SinonStub<
        Parameters<typeof dlObserver.dataLayerObserver>,
        ReturnType<typeof dlObserver.dataLayerObserver>
    >;
    const warnStub = sinon.stub();
    const fakeConsole = {
        warn: warnStub,
    } as unknown as ReturnType<typeof DC.DebugConsole>;
    const nnFnList: [string, any][] = [];

    beforeEach(() => {
        sandbox.stub(DC, 'DebugConsole').returns(fakeConsole);
        sandbox.stub(report, 'nonNativeFunctionsList').value(nnFnList);
        observerStub = sandbox.stub(dlObserver, 'dataLayerObserver');
        sandbox.stub(debugEnabled, 'debugEnabled').returns(true);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('works', () => {
        const ctx = {} as Window;
        useReportNonNativeFunctionProviderRaw(ctx);

        const [observerCtx, target, cb] = observerStub.getCall(0).args;
        chai.expect(observerCtx).to.equal(ctx);
        chai.expect(target).to.equal(nnFnList);

        const observerOnStub = sinon.stub();
        const observer = {
            observer: { on: observerOnStub },
        } as unknown as DataLayerObserverObject<unknown, unknown>;
        cb!(observer);
        const [onValCb] = observerOnStub.getCall(0).args;
        onValCb(['1', {}]);
        sinon.assert.calledOnce(warnStub);
    });
});
