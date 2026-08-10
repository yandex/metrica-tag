import * as chai from 'chai';
import sinon from 'sinon';
import { constructorName } from 'src/config';
import { yaNamespace } from 'src/const';
import { METHOD_NAME_HIT } from 'src/providers/artificialHit/const';
import { DEFAULT_COUNTER_TYPE } from 'src/providers/counterOptions/const';
import { STATIC_METHODS_KEY } from 'src/storage/global/consts';
import { metrikaNamespace } from 'src/storage/global/global';
import * as counterInstance from 'src/utils/counter/getInstance';
import { COUNTERS_GLOBAL_KEY } from 'src/utils/counter/getInstance';
import type { CounterObject } from 'src/utils/counter/type';
import type { CounterOptions } from 'src/utils/counterOptions';
import * as counterOptions from 'src/utils/counterOptions/getCounterKey';
import * as dlObserver from 'src/utils/dataLayerObserver/dataLayerObserver';
import { STACK_DATA_LAYER_NAME, STACK_FN_NAME } from '../const';
import { checkStack, handleCall, stackProxy } from '../stackProxy';
import type { StaticMethods } from '../types';

describe('stackProxy', () => {
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

    beforeEach(() => {
        observerStub = sinon.stub(dlObserver, 'dataLayerObserver');
        counterKeyStub = sinon.stub(counterOptions, 'getCounterKey');
        getCounterInstanceStub = sinon.stub(
            counterInstance,
            'getCounterInstance',
        );
    });

    afterEach(() => {
        observerStub.restore();
        counterKeyStub.restore();
        getCounterInstanceStub.restore();
    });

    it('handle items in dataLayer', () => {
        const constructorSpy = sinon.stub<[CounterOptions], CounterObject>();
        const counters: Record<string, CounterObject> = {};
        const win = {
            [yaNamespace]: {
                [constructorName]: constructorSpy,
                [metrikaNamespace]: {
                    [COUNTERS_GLOBAL_KEY]: counters,
                },
            },
        } as unknown as Window;
        const hitSpy = sinon.spy().named('hitSpy');
        constructorSpy.callsFake(({ id }) => {
            const counter = {
                hit: hitSpy,
            };
            counters[`${id}:0`] = counter;
            return counter;
        });
        getCounterInstanceStub.callsFake((_, { id }) => {
            if (!counters[`${id}:0`]) {
                return undefined;
            }
            return counters[`${id}:0`];
        });
        const testId = Math.floor(Math.random() * 100);
        handleCall(win)([testId, false as any]);
        sinon.assert.notCalled(getCounterInstanceStub);

        // Premature hit before init
        handleCall(win)([testId, METHOD_NAME_HIT]);
        sinon.assert.notCalled(constructorSpy);

        handleCall(win)([testId, 'init']);
        sinon.assert.calledOnce(constructorSpy);

        // Duplicate counter
        handleCall(win)([testId, 'init']);
        sinon.assert.calledOnce(constructorSpy);
        sinon.assert.calledWith(constructorSpy.getCall(0), {
            id: testId,
            counterType: DEFAULT_COUNTER_TYPE,
        });

        handleCall(win)([testId, METHOD_NAME_HIT]);
        sinon.assert.notCalled(hitSpy);

        checkStack(win, {
            id: testId,
            counterType: DEFAULT_COUNTER_TYPE,
        });
        sinon.assert.calledTwice(hitSpy);
    });

    it('handles static methods from registry', () => {
        const staticMethodSpy = sinon.stub<unknown[], void>();
        const staticMethodName = 'someStaticMethod' as StaticMethods;
        const staticMethodsStore = {
            [staticMethodName]: staticMethodSpy,
        };
        const win = {
            [yaNamespace]: {
                [constructorName]: {},
                [metrikaNamespace]: {
                    [STATIC_METHODS_KEY]: staticMethodsStore,
                },
            },
        } as unknown as Window;
        const args = [1, 'a', []];
        handleCall(win)([staticMethodName, ...args]);
        sinon.assert.calledOnceWithExactly(staticMethodSpy, ...args);
    });

    it('skips static method call when not in registry', () => {
        const staticMethodSpy = sinon.stub<unknown[], void>();
        const staticMethodName = 'someStaticMethod' as StaticMethods;
        const win = {
            [yaNamespace]: {
                [constructorName]: {
                    [staticMethodName]: staticMethodSpy,
                },
                [metrikaNamespace]: {},
            },
        } as unknown as Window;
        const args = [1, 'a', []];
        handleCall(win)([staticMethodName, ...args]);
        sinon.assert.notCalled(staticMethodSpy);
    });

    it('add counters info when it inited', () => {
        counterKeyStub.returns('1');
        const win = {} as Window;

        checkStack(win, {
            id: 1,
            counterType: '0',
        });
        sinon.assert.calledOnce(counterKeyStub);

        checkStack(win, {
            id: 1,
            counterType: '0',
        });
        sinon.assert.calledTwice(counterKeyStub);
    });

    it('handle push', () => {
        const dataLayer: unknown[] = [];
        const win = {
            [STACK_FN_NAME]: {
                [STACK_DATA_LAYER_NAME]: dataLayer,
            },
        } as unknown as Window;
        stackProxy(win);
        sinon.assert.calledWith(observerStub, win, dataLayer);
    });

    it('checks callbacks after init', () => {
        const dataLayer: unknown[] = [];
        const win = {
            [STACK_FN_NAME]: () => {},
        } as unknown as Window;

        stackProxy(win);
        sinon.assert.calledWith(observerStub, win, dataLayer);

        stackProxy({} as Window);
        sinon.assert.calledOnce(observerStub);
        chai.expect(
            (win as unknown as Record<string, Record<string, unknown>>)[
                STACK_FN_NAME
            ][STACK_DATA_LAYER_NAME],
        ).to.be.deep.eq([]);
    });

    it('checks existing of callbacks', () => {
        const dataLayer: unknown[] = [];
        const win = {
            [STACK_FN_NAME]: {
                [STACK_DATA_LAYER_NAME]: dataLayer,
            },
        } as unknown as Window;

        stackProxy(win);
        sinon.assert.calledWith(observerStub, win, dataLayer);

        stackProxy({} as Window);
        sinon.assert.calledOnce(observerStub);
    });
});
