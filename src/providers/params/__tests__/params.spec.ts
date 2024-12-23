import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sender from 'src/sender';
import * as errorLoggerUtils from 'src/utils/errorLogger/errorLogger';
import { WATCH_URL_PARAM, PARAMS_BR_KEY } from 'src/api/watch';
import { noop } from 'src/utils/function/noop';
import { CounterOptions } from 'src/utils/counterOptions';
import { SenderInfo } from 'src/sender/SenderInfo';
import { genPath } from 'src/utils/object';
import * as DebugConsole from 'src/providers/debugConsole/debugConsole';
import { PARAMS_PROVIDER } from '../const';
import { argsToParams, useParams } from '../params';

describe('params provider', () => {
    const testParams = { hi: 1 };
    const sandbox = sinon.createSandbox();
    const counterOptions: CounterOptions = {
        id: 10,
        counterType: '0',
    };
    const testUrl = 'https://example.com';
    let windowStub: any;
    const senderFunctionStub = (() => Promise.resolve()) as any;
    let errorLoggerStub: sinon.SinonStub<any, any>;
    let senderStub: sinon.SinonStub<any, any>;
    let debugStub: sinon.SinonStub<any, any>;

    beforeEach(() => {
        windowStub = {
            location: {
                href: testUrl,
            },
        };
        debugStub = sandbox.stub(DebugConsole, 'DebugConsole');
        senderStub = sandbox
            .stub(sender, 'getSender')
            .returns(senderFunctionStub);
        errorLoggerStub = sandbox.stub(errorLoggerUtils, 'errorLogger');
        errorLoggerStub.callsFake((ctx, scopeName, func) => func as any);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('pass if params is not a object', () => {
        const winInfo = {} as any;
        const { params } = useParams(winInfo, counterOptions);
        params(true);
        sinon.assert.notCalled(senderStub);
    });

    it('do nothing if params empty', () => {
        const winInfo = {} as any;
        const { params } = useParams(winInfo, counterOptions);
        params();
        sinon.assert.notCalled(senderStub);
    });
    it('calls sender', () => {
        const testHref = 'testHref';
        const testCtx = {};
        windowStub.location.href = testHref;
        senderStub
            .withArgs(windowStub, PARAMS_PROVIDER, counterOptions)
            .returns((senderParams: SenderInfo, opt: CounterOptions) => {
                chai.expect(opt).to.be.equal(counterOptions);
                chai.expect(
                    senderParams.middlewareInfo!.params,
                ).to.be.deep.equal(testParams);
                chai.expect(
                    senderParams!.brInfo!.getVal(PARAMS_BR_KEY),
                ).to.be.equal(1);
                const { urlParams } = senderParams!;
                chai.expect(urlParams![WATCH_URL_PARAM]).to.be.equal(testHref);
                return Promise.resolve('');
            });
        const { params } = useParams(windowStub, counterOptions);
        params(
            testParams,
            function a(this: any) {
                chai.expect(this).to.be.equal(testCtx);
            },
            testCtx,
        );
    });
    it('ok without callback and ctx', () => {
        const paramsInfo = [1, 2, 3];
        const res = genPath(paramsInfo);
        const info = argsToParams(paramsInfo);
        const { ctxInfo, params, callback } = info!;
        chai.expect(ctxInfo).to.be.equal(null);
        chai.expect(params).to.be.deep.equal(res);
        chai.expect(callback).to.be.equal(noop);
    });
    it('find last callback', () => {
        const paramsInfo: any[] = [1, 2, 3];
        const res = genPath(paramsInfo);
        const callbackInfo = () => {};
        const info = argsToParams(paramsInfo.concat([callbackInfo]));
        const { ctxInfo, params, callback } = info!;
        chai.expect(ctxInfo).to.be.equal(null);
        chai.expect(params).to.be.deep.equal(res);
        chai.expect(callback).to.be.equal(callbackInfo);
    });
    it('find last callback and ctx', () => {
        const paramsInfo: any[] = [1, 2, 3];
        const res = genPath(paramsInfo);
        const callbackInfo = () => {};
        const ctxData = {};
        const info = argsToParams(paramsInfo.concat([callbackInfo, ctxData]));
        const { ctxInfo, params, callback } = info!;
        chai.expect(ctxData).to.be.equal(ctxInfo);
        chai.expect(params).to.be.deep.equal(res);
        chai.expect(callback).to.be.equal(callbackInfo);
    });
    it('identifies User Params', () => {
        const userParams = { __ymu: { some: { dummy: 'params' } } };

        debugStub.returns({
            log: (str: string) => {
                chai.expect(str).to.equal(
                    `User params. Counter ${
                        counterOptions.id
                    }. Params: ${JSON.stringify(userParams)}`,
                );
            },
        } as any);

        const { params } = useParams(windowStub, counterOptions);
        params(userParams);
    });
    it('calls DebugConsole.log if passed UserID', () => {
        const userIDParams = { __ym: { ['user_id']: 123 } };

        debugStub.returns({
            log: (str: string) => {
                chai.expect(str).to.equal('Set user id 123');
            },
        } as any);

        const { params } = useParams(windowStub, counterOptions);
        params(userIDParams);
    });
    it("doesn't call DebugConsole.log if passed UserID of wrong format", () => {
        const logStub = sinon.fake();
        const userIDParams = { __ym: null };

        debugStub.returns({
            error: () => {},
            warn: () => {},
            log: logStub,
        });

        const { params } = useParams(windowStub, counterOptions);

        chai.expect(
            logStub.callCount,
            'DebugConsole.log should not have been called',
        ).to.equal(0);

        params(userIDParams);
    });
});
