import * as sinon from 'sinon';
import * as chai from 'chai';
import * as DC from 'src/providers/debugConsole/debugConsole';
import * as dlObserver from 'src/utils/dataLayerObserver';
import { useReportNonNativeFunctionProviderRaw } from '../index';
import * as report from '../report';

describe('reportNonNativeFunction', () => {
    const sandbox = sinon.createSandbox();
    let observerStub: sinon.SinonStub;
    const fakeConsole: any = {
        warn: sinon.stub(),
    };
    const nnFnList: any = [];

    beforeEach(() => {
        sandbox.stub(DC, 'DebugConsole').returns(fakeConsole);
        sandbox.stub(report, 'nonNativeFunctionsList').value(nnFnList);
        observerStub = sandbox.stub(dlObserver, 'dataLayerObserver');
        sandbox.stub(DC, 'debugEnabled').returns({
            isEnabled: true,
        } as any);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('works', () => {
        const ctx: any = {};
        useReportNonNativeFunctionProviderRaw(ctx);

        const [observerCtx, target, cb] = observerStub.getCall(0).args;
        chai.expect(observerCtx).to.equal(ctx);
        chai.expect(target).to.equal(nnFnList);

        const observer = { on: sinon.stub() };
        cb({ observer });
        const [onValCb] = observer.on.getCall(0).args;
        onValCb(['1', {}]);
        sinon.assert.calledOnce(fakeConsole.warn);
    });
});
