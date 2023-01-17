import * as sinon from 'sinon';
import * as chai from 'chai';
import * as report from 'src/providers/reportNonNativeFunctions/report';
import * as nf from '../isNativeFn';
import { isNativeFunction } from '../isNativeFunction';

describe('isNativeFunction', () => {
    const sandbox = sinon.createSandbox();
    let reportStub: sinon.SinonStub;
    let isNativeStub: sinon.SinonStub;

    beforeEach(() => {
        reportStub = sandbox.stub(report, 'reportNonNativeFunction');
        isNativeStub = sandbox.stub(nf, 'isNativeFn');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('Reports non-native functions', () => {
        const fn = () => {};
        isNativeStub.returns(true);
        chai.assert(isNativeFunction('fn', fn));
        chai.assert(reportStub.notCalled);

        isNativeStub.returns(false);
        chai.assert(!isNativeFunction('fn', null as any));
        chai.assert(reportStub.notCalled);

        isNativeStub.returns(false);
        chai.assert(!isNativeFunction('fn', fn));
        chai.assert(reportStub.calledWith(fn, 'fn'));
    });
});
