import * as chai from 'chai';
import * as sinon from 'sinon';
import * as gs from 'src/storage/global';
import type { GlobalStorage } from 'src/storage/global';
import type { CounterOptions } from 'src/utils/counterOptions';
import { telemetryCallCountDecorator } from '../telCallCount';
import { METHODS_TELEMETRY_GLOBAL_STORAGE_KEY } from '../const';

describe('counterMethodsTelemetry', () => {
    const sandbox = sinon.createSandbox();
    const getValStub = sandbox.stub();
    const setSafeStub = sandbox.stub();
    const fakeGlobalStorage = {
        setSafe: setSafeStub,
        getVal: getValStub,
    } as unknown as GlobalStorage;

    beforeEach(() => {
        sandbox.stub(gs, 'getGlobalStorage').returns(fakeGlobalStorage);
    });

    afterEach(() => {
        sandbox.restore();
        getValStub.reset();
        setSafeStub.reset();
    });

    it('works correctly', () => {
        const method = sandbox.stub();
        const fakeCtx = {} as Window;
        const methodCounters = { g: 1 };
        getValStub.returns(methodCounters);
        const decoratedMethod = telemetryCallCountDecorator(
            fakeCtx,
            {} as CounterOptions,
            'reachGoal',
            method,
        );
        decoratedMethod(1, 2, 3);
        sinon.assert.calledWith(
            setSafeStub,
            METHODS_TELEMETRY_GLOBAL_STORAGE_KEY,
        );
        sinon.assert.calledWith(
            getValStub,
            METHODS_TELEMETRY_GLOBAL_STORAGE_KEY,
        );

        sinon.assert.calledWith(method, 1, 2, 3);
        chai.expect(methodCounters.g).to.equal(2);
    });
});
