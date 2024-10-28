import * as chai from 'chai';
import * as sinon from 'sinon';
import { PAGE_VIEW_BR_KEY } from 'src/api/watch';
import {
    CounterOptions,
    getCounterKey,
    Params,
} from 'src/utils/counterOptions';
import { browserInfo } from 'src/utils/browserInfo';
import { SenderInfo } from 'src/sender/SenderInfo';
import * as storage from 'src/storage/global';
import * as config from 'src/config';
import * as json from 'src/utils/json';
import * as debug from 'src/utils/debugEvents';
import { getRange } from 'src/utils/array';
import { paramsMiddleware } from '../params';

describe('params middleware', () => {
    const win = () => {
        return {
            JSON,
        } as unknown as Window;
    };
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
    it("doesn't call a heavy callback", (done) => {
        const winInfo = win();
        const brInfo = browserInfo();
        brInfo.setVal(PAGE_VIEW_BR_KEY, 1);
        const stubConf = sandbox.stub(config, 'config').value({
            MAX_LEN_SITE_INFO: 1,
        });
        const stubStorage = sandbox.stub(storage, 'getGlobalStorage').returns({
            getVal: () => {
                return {
                    [getCounterKey(counterOptions)]: {
                        params: () => {
                            stubConf.restore();
                            stubStorage.restore();
                            done();
                        },
                    },
                };
            },
        } as unknown as storage.GlobalStorage);
        const bigParams = Array(getRange(100)).reduce(
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
            middleware.afterRequest(senderParams, () => {});
        }
    });
});
