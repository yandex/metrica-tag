import * as chai from 'chai';
import sinon from 'sinon';
import { config } from 'src/config';
import { yaNamespace } from 'src/const';
import { METHOD_NAME_HIT } from 'src/providers/artificialHit/const';
import { metrikaNamespace } from 'src/storage/global';
import * as async from 'src/utils/async';
import * as counterInstance from 'src/utils/counter';
import { COUNTERS_GLOBAL_KEY } from 'src/utils/counter';
import { CounterObject } from 'src/utils/counter/type';
import * as counterOptions from 'src/utils/counterOptions';
import { CounterOptions } from 'src/utils/counterOptions';
import * as dlObserver from 'src/utils/dataLayerObserver';
import * as func from 'src/utils/function';
import {
    checkStack,
    getCounterAndOptions,
    handleCall,
    stackProxy,
    STACK_DATA_LAYER_NAME,
    STACK_FN_NAME,
} from '../stackProxy';

describe('stackProxy', () => {
    const sandbox = sinon.createSandbox();
    let observerStub: sinon.SinonStub<
        Parameters<typeof dlObserver.dataLayerObserver>,
        ReturnType<typeof dlObserver.dataLayerObserver>
    >;
    let counterKeyStub: sinon.SinonStub<
        Parameters<typeof counterOptions.getCounterKey>,
        ReturnType<typeof counterOptions.getCounterKey>
    >;
    let getCounterInstanceStub: sinon.SinonStub<
        Parameters<typeof counterInstance.getCounterInstance>,
        ReturnType<typeof counterInstance.getCounterInstance>
    >;
    let bindArgsStub: sinon.SinonStub<
        Parameters<typeof func.bindArgs>,
        ReturnType<typeof func.bindArgs>
    >;
    let runAsyncStub: sinon.SinonStub<
        Parameters<typeof async.runAsync>,
        ReturnType<typeof async.runAsync>
    >;

    beforeEach(() => {
        observerStub = sandbox.stub(dlObserver, 'dataLayerObserver');
        counterKeyStub = sandbox.stub(counterOptions, 'getCounterKey');
        getCounterInstanceStub = sandbox.stub(
            counterInstance,
            'getCounterInstance',
        );
        bindArgsStub = sandbox.stub(func, 'bindArgs');
        runAsyncStub = sandbox.stub(async, 'runAsync');
    });

    afterEach(() => {
        sandbox.restore();
        sandbox.resetHistory();
    });

    it('handle items in dataLayer', () => {
        const counters: Record<string, CounterObject> = {};
        const constructorSpy = sinon
            .stub<[opt: CounterOptions], CounterObject>()
            .callsFake((opt) => {
                const counter = {} as CounterObject;
                counters[`${opt.id}:0`] = counter;
                return counter;
            });
        const win = {
            [yaNamespace]: {
                [config.constructorName]: constructorSpy,
                [metrikaNamespace]: {
                    [COUNTERS_GLOBAL_KEY]: counters,
                },
            },
        } as unknown as Window;
        const hitSpy = sinon.spy().named('hitSpy');
        getCounterInstanceStub.callsFake((_, { id }) => {
            if (!counters[`${id}:0`]) {
                return undefined;
            }
            return {
                hit: hitSpy,
            } as CounterObject;
        });
        const testId = Math.floor(Math.random() * 100);
        const handle = handleCall(win);

        handle([testId, false as any]);
        sinon.assert.notCalled(getCounterInstanceStub);
        handle([testId, METHOD_NAME_HIT]);
        sinon.assert.notCalled(constructorSpy);
        handle([testId, 'init']);
        sinon.assert.calledOnce(constructorSpy);
        handle([testId, 'init']);
        sinon.assert.calledOnceWithExactly(constructorSpy, {
            id: testId,
            counterType: '0',
        });
        handle([testId, METHOD_NAME_HIT]);
        sinon.assert.notCalled(hitSpy);
        checkStack(win, { id: testId, counterType: '0' });
        sinon.assert.calledTwice(hitSpy);
    });

    it('parse counter options', () => {
        const win = {} as Window;
        const testId = Math.floor(Math.random() * 100);

        getCounterAndOptions(win, testId);
        sinon.assert.calledOnceWithExactly(getCounterInstanceStub, win, {
            id: testId,
            counterType: '0',
        });
        getCounterAndOptions(win, `${testId}`);
        sinon.assert.calledWith(getCounterInstanceStub.getCall(1), win, {
            id: testId,
            counterType: '0',
        });
        const testCounterType = '1';
        getCounterAndOptions(win, `${testId}:${testCounterType}`);
        sinon.assert.calledWith(getCounterInstanceStub.getCall(2), win, {
            id: testId,
            counterType: testCounterType,
        });
    });

    it('add counters info when it inited', () => {
        counterKeyStub.returns('1');
        const win = {} as Window;
        checkStack(win, {
            id: 1,
            counterType: '0',
        });
        chai.expect(counterKeyStub.calledOnce).to.be.ok;
        checkStack(win, {
            id: 1,
            counterType: '0',
        });
    });

    it('handle push', () => {
        const dataLayer: any[] = [];
        const win = {
            [STACK_FN_NAME]: {
                [STACK_DATA_LAYER_NAME]: dataLayer,
            },
        } as unknown as Window;
        stackProxy(win);
        sinon.assert.calledOnceWithExactly(
            bindArgsStub,
            [win, dataLayer, sinon.match.func, true],
            observerStub,
        );
        sinon.assert.calledOnce(runAsyncStub);
    });

    it('checks callbacks after init', () => {
        const win = {
            [STACK_FN_NAME]: () => {},
        } as unknown as Window;
        stackProxy(win);
        sinon.assert.calledOnce(runAsyncStub);
        stackProxy({} as Window);
        sinon.assert.calledOnce(runAsyncStub);
        chai.expect(
            (win as any)[STACK_FN_NAME][STACK_DATA_LAYER_NAME],
        ).to.be.deep.eq([]);
    });

    it('checks existing of callbacks', () => {
        const win = {
            [STACK_FN_NAME]: {
                [STACK_DATA_LAYER_NAME]: [],
            },
        } as unknown as Window;
        stackProxy(win);
        sinon.assert.calledOnce(runAsyncStub);
        stackProxy({} as Window);
        sinon.assert.calledOnce(runAsyncStub);
    });
});
