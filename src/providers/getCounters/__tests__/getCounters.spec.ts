import * as chai from 'chai';
import sinon from 'sinon';
import * as globalConfig from 'src/storage/global';
import * as closureStorageModule from 'src/storage/closureStorage';
import type { GlobalStorage } from 'src/storage/global';
import type { ClosureState } from 'src/storage/closureStorage/types';
import { createCountersGetter, getCountersProvider } from '../getCounters';
import {
    OLD_CODE_KEY,
    COUNTER_STATE_CLICKMAP,
    COUNTER_STATE_OLD_CODE,
    COUNTER_STATE_ID,
    COUNTER_STATE_TYPE,
    COUNTER_STATE_TRACK_HASH,
} from '../const';

describe('getCounters feature', () => {
    const sandbox = sinon.createSandbox();
    const ctx: any = { [OLD_CODE_KEY]: 1 };
    afterEach(() => {
        sandbox.restore();
    });
    it('createCountersGetter', () => {
        const counter1 = 'counterId1';
        const counter2 = 'counterId2';
        const getGSVal = sandbox.stub().returns({
            [counter1]: {},
            [counter2]: {},
        });
        const closureState = {
            [counter1]: {
                id: counter1,
                [COUNTER_STATE_CLICKMAP]: 1,
            },
            [counter2]: {
                id: counter2,
            },
        };
        const stateManager = sandbox
            .stub<[fn: (state: ClosureState<unknown>) => void], unknown>()
            .callsFake((stateHandler) => stateHandler(closureState));
        sandbox
            .stub(globalConfig, 'getGlobalStorage')
            .onFirstCall()
            .returns({
                getVal: getGSVal,
            } as unknown as GlobalStorage)
            .returns({
                getVal: sandbox.stub().returns(stateManager),
                setSafe: sandbox.spy(),
            } as unknown as GlobalStorage);
        const getter = createCountersGetter(ctx);
        const counters = getter();
        chai.expect(counters).to.deep.equal([
            {
                id: counter1,
                [COUNTER_STATE_OLD_CODE]: true,
                [COUNTER_STATE_CLICKMAP]: true,
            },
            {
                id: counter2,
                [COUNTER_STATE_OLD_CODE]: true,
                [COUNTER_STATE_CLICKMAP]: false,
            },
        ]);
    });
    it('getCountersProvider', () => {
        const counterId = 123;
        const counterType = '0';
        const counterKey = `${counterId}:${counterType}`;
        const setValStub = sandbox.stub(closureStorageModule, 'setVal');
        const delValStub = sandbox.stub(closureStorageModule, 'deleteVal');
        const destroy = getCountersProvider(ctx, {
            counterType,
            id: counterId,
            clickmap: 1,
            webvisor: false,
            trackHash: true,
        } as any);
        const [callCtx, key, counterState] = setValStub.getCall(0).args;
        chai.expect(key).to.equal(counterKey);
        chai.expect(callCtx).to.equal(ctx);
        chai.expect(counterState).to.deep.equal({
            [COUNTER_STATE_ID]: counterId,
            [COUNTER_STATE_TYPE]: 0,
            [COUNTER_STATE_CLICKMAP]: 1,
            [COUNTER_STATE_TRACK_HASH]: true,
        });
        destroy();
        sinon.assert.calledWith(delValStub, ctx, counterKey);
    });
});
