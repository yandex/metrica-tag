import * as chai from 'chai';
import sinon from 'sinon';
import * as globalConfig from 'src/storage/global/getGlobal';
import * as closureStorageModule from 'src/storage/closureStorage/closureStorage';
import type { GlobalStorage } from 'src/storage/global/global';
import type { StateManager } from 'src/storage/closureStorage/types';
import type { CounterOptions } from 'src/utils/counterOptions';
import { createCountersGetter, getCountersProvider } from '../getCounters';
import {
    COUNTER_STATE_CLICKMAP,
    COUNTER_STATE_ID,
    COUNTER_STATE_TYPE,
    COUNTER_STATE_TRACK_HASH,
} from '../const';
import type { CounterInfo } from '../types';

describe('getCounters feature', () => {
    const sandbox = sinon.createSandbox();
    const ctx = {} as Window;
    afterEach(() => {
        sandbox.restore();
    });
    it('createCountersGetter', () => {
        const counter1 = 11;
        const counter2 = 22;
        const getGSVal = sandbox.stub().returns({
            [counter1]: {},
            [counter2]: {},
        });
        const setGSVal = sandbox.spy();
        const closureState = {
            [counter1]: {
                id: counter1,
                [COUNTER_STATE_CLICKMAP]: true,
            },
            [counter2]: {
                id: counter2,
            },
        };
        const stateManager = sandbox
            .stub<
                Parameters<StateManager<CounterInfo>>,
                ReturnType<StateManager<CounterInfo>>
            >()
            .callsFake((stateHandler) => stateHandler(closureState));
        sandbox
            .stub(globalConfig, 'getGlobalStorage')
            .onFirstCall()
            .returns({
                getVal: getGSVal,
                setVal: setGSVal,
            } as unknown as GlobalStorage)
            .returns({
                getVal: sandbox.stub().returns(stateManager),
                setVal: setGSVal,
                setSafe: sandbox.spy(),
            } as unknown as GlobalStorage);
        const getter = createCountersGetter(ctx);
        const counters = getter();
        chai.expect(counters).to.deep.equal([
            {
                id: counter1,
                [COUNTER_STATE_CLICKMAP]: true,
            },
            {
                id: counter2,
                [COUNTER_STATE_CLICKMAP]: false,
            },
        ]);
    });
    it('getCountersProvider', () => {
        const counterId = 123;
        const counterType = '0';
        const counterKey = `${counterId}:${counterType}`;
        const counterOptions: CounterOptions = {
            counterType,
            id: counterId,
            clickmap: true,
            enableAll: true,
            trackHash: true,
        };
        const setValStub = sandbox.stub(closureStorageModule, 'setVal');
        const delValStub = sandbox.stub(closureStorageModule, 'deleteVal');

        const destroy = getCountersProvider(ctx, counterOptions);
        sinon.assert.calledWith(setValStub.getCall(0), ctx, counterKey, {
            [COUNTER_STATE_ID]: counterId,
            [COUNTER_STATE_TYPE]: 0,
            [COUNTER_STATE_CLICKMAP]: true,
            [COUNTER_STATE_TRACK_HASH]: true,
        });

        destroy();
        sinon.assert.calledOnceWithExactly(delValStub, ctx, counterKey);
    });
});
