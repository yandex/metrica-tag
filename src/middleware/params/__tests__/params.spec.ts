import * as chai from 'chai';
import * as sinon from 'sinon';
import { PAGE_VIEW_BR_KEY } from 'src/api/watch';
import type { ParamsHandler } from 'src/providers/params/const';
import type { SenderInfo } from 'src/sender/SenderInfo';
import * as storage from 'src/storage/global/getGlobal';
import type { GlobalStorage } from 'src/storage/global/global';
import { getRange } from 'src/utils/array/utils';
import { browserInfo } from 'src/utils/browserInfo/browserInfo';
import type { CounterObject } from 'src/utils/counter/type';
import { getCounterKey } from 'src/utils/counterOptions/getCounterKey';
import type { CounterOptions, Params } from 'src/utils/counterOptions/types';
import * as debug from 'src/utils/debugEvents';
import * as json from 'src/utils/json';
import { paramsMiddleware } from '../params';

describe('params middleware', () => {
    const win = () => ({ JSON }) as Window;
    const sandbox = sinon.createSandbox();
    const params = { hi: 1 };
    const counterOptions: CounterOptions = {
        id: 332,
        counterType: '0',
    };

    beforeEach(() => {
        sandbox.stub(debug, 'dispatchDebuggerEvent');
    });
    afterEach(() => {
        sandbox.restore();
    });

    it('call callback', () => {
        const winInfo = win();
        const brInfo = browserInfo();
        const senderParams: SenderInfo = {
            brInfo,
            middlewareInfo: {
                params,
            },
            urlParams: {},
        };
        const middleware = paramsMiddleware(winInfo, counterOptions);
        if (middleware.beforeRequest) {
            middleware.beforeRequest(senderParams, () => {
                chai.expect(senderParams.transportInfo!.rBody).to.be.equal(
                    JSON.stringify(params),
                );
            });
        }
    });

    it('send nothing if stringify broken', (done) => {
        const winInfo = win();
        const brInfo = browserInfo();
        const senderParams: SenderInfo = {
            brInfo,
            middlewareInfo: {
                params,
            },
        };
        const parseStub = sandbox.stub(json, 'stringify').returns('');
        const middleware = paramsMiddleware(winInfo, counterOptions);
        if (middleware.beforeRequest) {
            middleware.beforeRequest(senderParams, () => {
                parseStub.restore();
                chai.expect(senderParams.transportInfo?.rBody).to.be.not.ok;
                done();
            });
        }
    });

    it("doesn't call a heavy callback", () => {
        const winInfo = win();
        const brInfo = browserInfo();
        brInfo.setVal(PAGE_VIEW_BR_KEY, 1);
        const paramsStub = sandbox.stub<
            Parameters<ParamsHandler<CounterObject>>,
            ReturnType<ParamsHandler<CounterObject>>
        >();
        sandbox.stub(storage, 'getGlobalStorage').returns({
            getVal: () => ({
                [getCounterKey(counterOptions)]: {
                    params: paramsStub,
                },
            }),
        } as unknown as GlobalStorage);
        const bigParams = getRange(500).reduce(
            (acc, x, i) => Object.assign(acc, { [i]: params }),
            {} as Params,
        );
        const senderParams: SenderInfo = {
            brInfo,
            middlewareInfo: {
                params: bigParams,
            },
            urlParams: {},
        };
        const middleware = paramsMiddleware(winInfo, counterOptions);
        if (middleware.beforeRequest) {
            middleware.beforeRequest(senderParams, () => {
                chai.expect(senderParams.transportInfo?.rBody).to.be.equal(
                    undefined,
                );
            });
        }
        if (middleware.afterRequest) {
            middleware.afterRequest(senderParams, () => {
                sinon.assert.calledOnceWithExactly(paramsStub, bigParams);
            });
        }
    });
});
