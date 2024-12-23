import * as chai from 'chai';
import * as sinon from 'sinon';
import * as dataLayer from 'src/utils/dataLayerObserver/dataLayerObserver';
import * as iframe from 'src/utils/iframeConnector/iframeSender';
import * as counter from 'src/utils/counter/getInstance';
import {
    MessageData,
    IFRAME_MESSAGE_TYPE,
    IFRAME_MESSAGE_DATA,
} from 'src/utils/iframeConnector';
import { CounterOptions } from 'src/utils/counterOptions';
import {
    useYan,
    INNER_DL_PARAMS,
    INNER_PARENT_PARAMS,
    paramsHandler,
    SENDED_KEY,
} from 'src/providers/yan/yan';
import { METHOD_NAME_PARAMS } from '../../params/const';

describe('yan', () => {
    const dataLayerList: any[] = [];
    const sandbox = sinon.createSandbox();
    const counterId = 1324;
    const counterOptions: CounterOptions = {
        id: counterId,
        counterType: '0',
    };
    const testParams = { hi: 1 };
    const win = () => {
        return {} as any as Window;
    };
    let getterDataLayer: sinon.SinonStub<any, any>;
    let innerDataLayer: sinon.SinonStub<any, any>;
    let iframeSenderStub: sinon.SinonStub<any, any>;
    let counterInstanceStub: sinon.SinonStub<any, any>;
    let sendToParentsStub: sinon.SinonStub<any, any>;
    const emitterStub = {
        on: sandbox.stub(),
    };

    beforeEach(() => {
        getterDataLayer = sandbox.stub(dataLayer, 'getInnerDataLayer');
        sendToParentsStub = sandbox.stub();
        getterDataLayer.returns(dataLayerList as any);

        innerDataLayer = sandbox.stub(dataLayer, 'innerDataLayerObserver');

        iframeSenderStub = sandbox.stub(iframe, 'iframeSender');
        iframeSenderStub.returns({
            emitter: emitterStub,
            sendToParents: sendToParentsStub,
        } as any);

        counterInstanceStub = sandbox.stub(counter, 'getCounterInstance');
        counterInstanceStub.returns({
            [METHOD_NAME_PARAMS]: (params: unknown) =>
                chai.expect(params).to.be.deep.equal(testParams),
        } as any);
    });
    afterEach(() => {
        sandbox.restore();
        emitterStub.on.resetHistory();
    });
    it('params handler sends params if counterId defined', () => {
        const message = {
            [IFRAME_MESSAGE_TYPE]: '1',
            [SENDED_KEY]: [1],
            ['counter']: counterId.toString(),
            [IFRAME_MESSAGE_DATA]: testParams,
        } as any;
        counterInstanceStub.returns({
            [METHOD_NAME_PARAMS]: (params: any) => {
                chai.expect(params).to.be.eq(testParams);
            },
        });
        paramsHandler(win(), iframeSenderStub as any, counterOptions, message);
        chai.expect(message[SENDED_KEY]).to.be.deep.eq([
            1,
            counterId.toString(),
        ]);
    });
    it('params handler add sended in exist array ', () => {
        const message = {
            [IFRAME_MESSAGE_TYPE]: '1',
            [SENDED_KEY]: [1],
            [IFRAME_MESSAGE_DATA]: testParams,
        } as any;
        counterInstanceStub.returns({
            [METHOD_NAME_PARAMS]: (params: any) => {
                chai.expect(params).to.be.eq(testParams);
            },
        });
        paramsHandler(win(), iframeSenderStub as any, counterOptions, message);
        chai.expect(message[SENDED_KEY]).to.be.deep.eq([
            1,
            counterId.toString(),
        ]);
    });
    it('params handler skip if no counter', () => {
        counterInstanceStub.returns(null);
        const message = {
            [IFRAME_MESSAGE_TYPE]: '1',
        } as any;
        paramsHandler(win(), iframeSenderStub as any, counterOptions, message);
        chai.expect(message[SENDED_KEY]).to.be.undefined;
    });
    it('frame handler check', () => {
        const winInfo = win();
        useYan(winInfo, counterOptions);
        sinon.assert.calledOnce(getterDataLayer);
        const [firstCall] = emitterStub.on.getCalls();
        const [eventName, cb] = firstCall.args;
        chai.expect(eventName).to.deep.eq([INNER_DL_PARAMS]);
        sinon.assert.notCalled(counterInstanceStub);
        counterInstanceStub.returns({
            [METHOD_NAME_PARAMS]: () => {},
        });
        cb([1, {}]);
        sinon.assert.calledOnce(counterInstanceStub);
    });
    it('skip if sender is broken', () => {
        const winInfo = win();
        iframeSenderStub.returns(null);
        useYan(winInfo, counterOptions);
        sinon.assert.notCalled(getterDataLayer);
    });
    it('ok path', () => {
        const winInfo = win();
        innerDataLayer.callsFake((ctx, array, callback) => {
            const fakeEmitter = {} as any;
            if (!callback) {
                return fakeEmitter;
            }
            chai.expect(array).to.be.equal(dataLayerList);
            chai.expect(ctx).to.be.equal(winInfo);
            fakeEmitter.on = (s: string[], cb: (m: MessageData) => void) => {
                chai.expect(s).to.deep.equal([INNER_DL_PARAMS]);
                cb({
                    [IFRAME_MESSAGE_TYPE]: 'params',
                    [IFRAME_MESSAGE_DATA]: testParams,
                    [INNER_PARENT_PARAMS]: 1,
                });
                return fakeEmitter;
            };
            callback(fakeEmitter);
            return fakeEmitter;
        });
        useYan(winInfo, counterOptions);
    });
});
