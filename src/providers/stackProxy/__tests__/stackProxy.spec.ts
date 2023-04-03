import * as chai from 'chai';
import sinon from 'sinon';
import { config } from 'src/config';
import { yaNamespace } from 'src/const';
import * as dlObserver from 'src/utils/dataLayerObserver';
import * as counterInstance from 'src/utils/counter';
import * as counterOptions from 'src/utils/counterOptions';
import { metrikaNamespace } from 'src/storage/global';
import { COUNTERS_GLOBAL_KEY } from 'src/utils/counter';
import { METHOD_NAME_HIT } from 'src/providers/artificialHit/const';
import {
    stackProxy,
    STACK_FN_NAME,
    STACK_DATA_LAYER_NAME,
    checkStack,
    getCounterAndOptions,
    handleCall,
} from '../stackProxy';

describe('stackProxy', () => {
    let observerStub: sinon.SinonStub<any, any>;
    let counterKeyStub: sinon.SinonStub<any, any>;
    let getCounterInstanceStub: sinon.SinonStub<any, any>;
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
    it('hanlde items in dataLayer', () => {
        const constructorSpy = sinon.stub();
        const counters: Record<string, 1> = {};
        const win = {
            [yaNamespace]: {
                [config.constructorName]: constructorSpy,
                [metrikaNamespace]: {
                    [COUNTERS_GLOBAL_KEY]: counters,
                },
            },
        } as any as Window;
        constructorSpy.callsFake(({ id }: { id: number }) => {
            counters[`${id}:0`] = 1;
            return 1;
        });
        const hitSpy = sinon.spy().named('hitSpy');
        getCounterInstanceStub.callsFake(
            (_: Window, { id }: { id: number }) => {
                if (!counters[`${id}:0`]) {
                    return 0;
                }
                return {
                    hit: hitSpy,
                };
            },
        );
        const testId = Math.floor(Math.random() * 100);
        handleCall(win)([testId, false as any]);
        sinon.assert.notCalled(getCounterInstanceStub);
        handleCall(win)([testId, METHOD_NAME_HIT]);
        sinon.assert.notCalled(constructorSpy);
        handleCall(win)([testId, 'init']);
        sinon.assert.calledOnce(constructorSpy);
        handleCall(win)([testId, 'init']);
        sinon.assert.calledOnce(constructorSpy);
        const {
            args: [counterInfo],
        }: any = constructorSpy.getCall(0);
        chai.expect(counterInfo.id).to.be.equal(testId);
        chai.expect(counterInfo.counterType).to.be.equal('0');
        handleCall(win)([testId, METHOD_NAME_HIT]);
        sinon.assert.notCalled(hitSpy);
        checkStack(win, {
            id: testId,
            counterType: '0',
        });
        chai.expect(hitSpy.getCalls().length).to.be.equal(2);
    });
    it('parse counter options', () => {
        const win = {} as any as Window;
        const testId = Math.floor(Math.random() * 100);
        getCounterAndOptions(win, testId);
        let {
            args: [cWin, counterInfo],
        }: any = getCounterInstanceStub.getCall(0);
        chai.expect(counterInfo.id).to.be.equal(testId);
        chai.expect(cWin).to.be.equal(win);
        getCounterAndOptions(win, `${testId}`);
        ({
            args: [cWin, counterInfo],
        } = getCounterInstanceStub.getCall(1));
        chai.expect(counterInfo.id).to.be.equal(testId);
        const testCounterType = '1';
        getCounterAndOptions(win, `${testId}:${testCounterType}`);
        ({
            args: [cWin, counterInfo],
        } = getCounterInstanceStub.getCall(2));
        chai.expect(counterInfo.id).to.be.equal(testId);
        chai.expect(counterInfo.counterType).to.be.equal(testCounterType);
    });
    it('add counters info when it inited', () => {
        counterKeyStub.returns('1');
        const win = {} as any as Window;
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
        } as any as Window;
        stackProxy(win);
        chai.expect(observerStub.calledWith(win, dataLayer)).to.be.ok;
    });
    it('checks callbacks after init', () => {
        const dataLayer: any[] = [];
        const win = {
            [STACK_FN_NAME]: () => {},
        } as any as Window;
        stackProxy(win);
        sinon.assert.calledWith(observerStub, win, dataLayer);
        stackProxy({} as any as Window);
        sinon.assert.calledOnce(observerStub);
        chai.expect(
            (win as any)[STACK_FN_NAME][STACK_DATA_LAYER_NAME],
        ).to.be.deep.eq([]);
    });
    it('checks existing of callbacks', () => {
        const dataLayer: any[] = [];
        const win = {
            [STACK_FN_NAME]: {
                [STACK_DATA_LAYER_NAME]: dataLayer,
            },
        } as any as Window;
        stackProxy(win);
        chai.expect(observerStub.calledWith(win, dataLayer)).to.be.ok;
        stackProxy({} as any as Window);
        chai.expect(observerStub.calledOnce).to.be.ok;
    });
});
