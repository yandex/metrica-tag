import * as chai from 'chai';
import * as sinon from 'sinon';
import * as globalStorage from 'src/storage/global';
import { CounterOptions } from 'src/utils/counterOptions';
import { destruct } from '../destruct';

describe('destruct provider', () => {
    const sandbox = sinon.createSandbox();
    const gs = {
        getVal: sandbox.stub(),
    };

    beforeEach(() => {
        sandbox.stub(globalStorage, 'getGlobalStorage').returns(gs as any);
    });

    afterEach(() => {
        sandbox.restore();
        gs.getVal.resetHistory();
    });

    it('calls callback array provided and removes counter from config', () => {
        const cb1 = sinon.stub();
        const cb2 = sinon.stub();
        const counterId = 100;
        const counterType = '0';
        const counterKey = `${counterId}:${counterType}`;
        const counters = {
            [counterKey]: {},
        };
        const globalKey = `yaCounter${counterId}`;
        const windowStub = {
            [globalKey]: {},
        } as any;
        gs.getVal.returns(counters);
        const callbacks = [cb1, null, cb2] as any[];
        const counterOptions: CounterOptions = {
            id: counterId,
            counterType: '0',
        };
        const destructor = destruct(windowStub, counterOptions, callbacks);
        destructor();

        chai.expect(cb1.calledOnce).to.be.true;
        chai.expect(cb2.calledOnce).to.be.true;
        chai.expect(counters['100:0']).to.not.exist;
        chai.expect(windowStub[globalKey]).to.not.exist;
    });
});
