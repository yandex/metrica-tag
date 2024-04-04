import * as chai from 'chai';
import * as sinon from 'sinon';
import { REQUEST_MODE_KEY } from 'src/api/watch';
import * as numberUtils from 'src/utils/number';
import * as deferBase from 'src/utils/defer/base';
import * as domUtils from 'src/utils/dom';
import * as knownErrorUtils from 'src/utils/errorLogger/knownError';
import * as watchModes from 'src/transport/watchModes';
import * as utils from 'src/utils';
import { InternalTransportOptions, TransportFn } from 'src/transport/types';

import { useJsonp, CALLBACK_PREFIX } from '../jsonp';

describe('JSONP', () => {
    const TID = parseInt(Math.random().toString().slice(3), 10);
    const RANDOM = 42;
    const CALLBACK_KEY = `${CALLBACK_PREFIX}${RANDOM}`;
    const testUrl = 'testUrl';
    const testResp = {
        im: 'test',
    };
    const sandbox = sinon.createSandbox();

    let createFn: sinon.SinonStub<any>;
    let insertScript: sinon.SinonStub<any>;
    let getRandom: sinon.SinonStub<any>;
    let removeNode: sinon.SinonStub<any>;
    let createKnownStub: sinon.SinonStub<any>;
    let setDeferStub: sinon.SinonStub<any>;
    let clearDeferStub: sinon.SinonStub<any>;
    let promiseCallback: Function | null = null;
    let win: Window;

    const testWmode = (wmode: boolean) => {
        it(`check wmode ${wmode}`, () => {
            const watchModesStub = sandbox.stub(watchModes, 'getSrcUrl');
            const scriptStub: { onload?: () => void } = {};
            const transportOpt: InternalTransportOptions = {
                wmode,
                debugStack: [],
            };

            insertScript.returns(scriptStub);

            const result = useJsonp(win);

            if (!result) {
                chai.expect.fail('wrong type');
            }
            const resolve = sinon.stub();
            const reject = sinon.stub();

            result(testUrl, transportOpt);
            promiseCallback!(resolve, reject);
            const [, , query] = watchModesStub.firstCall.args;
            chai.expect(scriptStub).to.have.property('onload');
            chai.expect(win).to.have.property(CALLBACK_KEY);
            chai.expect(query[REQUEST_MODE_KEY]).to.eq('5');
            sinon.assert.calledOnce(setDeferStub);

            scriptStub.onload!();
            (win as any)[CALLBACK_KEY](testResp);

            const [resp] = resolve.getCall(0).args;
            const [, actualTid] = clearDeferStub.getCall(0).args;
            chai.expect(resp).to.deep.eq(testResp);
            chai.expect(win).to.not.have.property(CALLBACK_KEY);
            chai.expect(actualTid).to.eq(TID);
            sinon.assert.calledOnce(insertScript);
            sinon.assert.calledOnce(removeNode.withArgs(scriptStub));
        });
    };

    beforeEach(() => {
        win = {} as any as Window;
        sandbox.stub(utils, 'PolyPromise').callsFake((callback) => {
            promiseCallback = callback;
        });
        removeNode = sandbox.stub(domUtils, 'removeNode');
        getRandom = sandbox.stub(numberUtils, 'getRandom');
        setDeferStub = sandbox.stub(deferBase, 'setDeferBase').returns(TID);
        clearDeferStub = sandbox.stub(deferBase, 'clearDefer');
        insertScript = sandbox.stub(domUtils, 'insertScript');
        createFn = sandbox.stub(domUtils, 'getElemCreateFunction');
        createKnownStub = sandbox.stub(knownErrorUtils, 'createKnownError');

        createFn.returns(true);
        getRandom.returns(RANDOM);
    });
    afterEach(() => {
        promiseCallback = null;
        sandbox.restore();
    });
    it('calls getElemCreateFunction when check', () => {
        createFn.returns(null);
        const result = useJsonp(win);
        sinon.assert.calledOnce(createFn);
        chai.expect(result).to.be.not.ok;
    });
    it('create callback before script loading', () => {
        const scriptStub = {};
        const result = useJsonp(win);
        const transportOpt: InternalTransportOptions = {
            wmode: true,
            debugStack: [],
        };
        if (!result) {
            chai.expect.fail('wrong type');
        }
        insertScript.callsFake(() => {
            chai.expect((win as any)[CALLBACK_KEY]).to.be.ok;
            return scriptStub;
        });
        result(testUrl, transportOpt);
    });
    it('return function after check', () => {
        const result = useJsonp(win);
        const transportOpt: InternalTransportOptions = {
            wmode: false,
            timeOut: 0,
            debugStack: [],
        };
        chai.expect(createFn.calledOnce).to.be.ok;
        chai.expect(result).to.be.a('function');
        if (!result) {
            chai.expect.fail('wrong type');
        }

        const resolve = sinon.stub();
        const reject = sinon.stub();
        result(testUrl, transportOpt);
        promiseCallback!(resolve, reject);

        const [e] = reject.getCall(0).args;
        chai.expect(e.message).to.eq('jp.s');
    });
    testWmode(true);
    testWmode(false);
    it('produces a verbose error message', () => {
        const scriptStub = {} as { onerror: () => void };
        insertScript.returns(scriptStub);
        const resolve = sinon.stub();
        const reject = sinon.stub();
        const result = useJsonp(win) as Exclude<
            ReturnType<typeof useJsonp>,
            false
        >;
        const debugStack = ['jso', 'n', 'p'];

        result(testUrl, { debugStack });
        promiseCallback!(resolve, reject);

        scriptStub.onerror();
        chai.assert(reject.called);

        const [actualDebugStack] = createKnownStub.getCall(0).args;
        const [, actualTid] = clearDeferStub.getCall(0).args;
        chai.expect(actualDebugStack).to.deep.eq(debugStack);
        chai.expect(win).to.not.have.property(CALLBACK_KEY);
        chai.expect(actualTid).to.eq(TID);
        sinon.assert.calledOnce(removeNode.withArgs(scriptStub));
        sinon.assert.calledOnce(setDeferStub);
    });
    it('callaback should catch errors', () => {
        const error = new Error('test error');
        const scriptStub = {} as any;
        const transportOpt: InternalTransportOptions = {
            debugStack: [],
        };
        const resolve = sinon.stub();
        const reject = sinon.stub();
        insertScript.returns(scriptStub);
        removeNode.throws(error);

        const result = useJsonp(win) as TransportFn;
        chai.assert(resolve.notCalled);
        chai.assert(reject.notCalled);

        result(testUrl, transportOpt);
        promiseCallback!(resolve, reject);
        scriptStub.onload();
        (win as any)[CALLBACK_KEY](testResp);
        chai.assert(reject.calledWith(error));
    });
    it('considers edge case when server responds after timeout', () => {
        const scriptStub = {} as Record<'onload' | 'onerror', () => void>;
        const transportOpt: InternalTransportOptions = {
            debugStack: [],
        };
        const resolve = sinon.stub();
        const reject = sinon.stub();
        insertScript.returns(scriptStub);

        const result = useJsonp(win) as TransportFn;
        result(testUrl, transportOpt);
        promiseCallback!(resolve, reject);
        const [deferCtx, deferCallback, deferTimeout] =
            setDeferStub.getCall(0).args;
        chai.expect(deferCtx).to.equal(win);
        chai.expect(deferTimeout).to.equal(10000);
        deferCallback();
        scriptStub.onload();

        (win as any)[CALLBACK_KEY](testResp);
        chai.assert(resolve.called);
        chai.expect(scriptStub).to.have.property('onload');
    });
});
