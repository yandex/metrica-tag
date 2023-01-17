import * as chai from 'chai';
import * as sinon from 'sinon';
import * as gs from 'src/storage/global';
import { telemetryCallCountDecorator } from '../telCallCount';
import { METHODS_TELEMETRY_GLOBAL_STORAGE_KEY } from '../consts';

describe('counterMethodsTelemetry', () => {
    const sandbox = sinon.createSandbox();
    const fakeGlobalStorage: any = {
        setSafe: sandbox.stub(),
        getVal: sandbox.stub(),
    };

    beforeEach(() => {
        sandbox.stub(gs, 'getGlobalStorage').returns(fakeGlobalStorage);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('works correctly', () => {
        const method = sandbox.stub();
        const fakeCtx: any = {};
        const methodCounters = { g: 1 };
        fakeGlobalStorage.getVal.returns(methodCounters);
        const decoratedMethod = telemetryCallCountDecorator(
            fakeCtx,
            {} as any,
            'reachGoal',
            method,
        );
        decoratedMethod(1, 2, 3);
        sinon.assert.calledWith(
            fakeGlobalStorage.setSafe,
            METHODS_TELEMETRY_GLOBAL_STORAGE_KEY,
        );
        sinon.assert.calledWith(
            fakeGlobalStorage.getVal,
            METHODS_TELEMETRY_GLOBAL_STORAGE_KEY,
        );

        sinon.assert.calledWith(method, 1, 2, 3);
        chai.expect(methodCounters.g).to.equal(2);
    });
});
