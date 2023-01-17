import * as sinon from 'sinon';
import { expect, assert } from 'chai';
import { FORCE_URLENCODED_KEY } from 'src/api/common';
import * as func from 'src/utils/function';
import * as bro from 'src/utils/browser';
import { isKnownError } from 'src/utils/errorLogger/knownError';
import { request, useBeacon } from '../beacon';

describe('beacon transport', () => {
    let isNativeStub: sinon.SinonStub<any, any>;
    let isAndroidStub: sinon.SinonStub<any, any>;
    let beaconStub: sinon.SinonStub<any, any>;
    const sandbox = sinon.createSandbox();
    let ctx = {
        navigator: {
            sendBeacon: () => {},
        },
    } as any;
    const testUrl = 'testUrl';
    const transportOpt = {
        rQuery: { a: 1 },
        rBody: 'testBody',
    };
    const anyRequest = request as any;
    beforeEach(() => {
        isNativeStub = sandbox.stub(func, 'isNativeFunction');
        isAndroidStub = sandbox.stub(bro, 'isAndroidWebView');
        isNativeStub.returns(false);
        isAndroidStub.returns(true);
        beaconStub = sandbox.stub();
        ctx = {
            navigator: {
                sendBeacon: beaconStub,
            },
        } as any;
    });
    afterEach(() => {
        sandbox.reset();
        sandbox.restore();
    });
    it('checks availability in ctx', () => {
        const result = useBeacon({} as any);
        sinon.assert.notCalled(isNativeStub);
        expect(result).to.be.false;
    });
    it('false if no beacon', () => {
        const result = useBeacon({} as any);
        isAndroidStub.returns(false);
        sinon.assert.notCalled(isNativeStub);
        expect(result).to.be.false;
    });
    it('checks native', () => {
        isAndroidStub.returns(false);
        const result = useBeacon(ctx);
        sinon.assert.calledOnce(isNativeStub);
        expect(result).to.be.false;
    });
    it('checks android web view', () => {
        isNativeStub.returns(true);
        isAndroidStub.returns(false);
        const result = useBeacon(ctx);
        expect(result).to.be.a('function');
    });
    it('checks onLine before request', (done) => {
        const result = anyRequest(ctx, beaconStub, testUrl, transportOpt);
        result.catch(() => {
            sinon.assert.notCalled(beaconStub);
            done();
        });
    });
    it('reject request is sender return false', (done) => {
        ctx.navigator.onLine = true;
        beaconStub.returns(false);
        const result = anyRequest(ctx, beaconStub, testUrl, transportOpt);
        result.catch(() => {
            sinon.assert.calledWith(
                beaconStub,
                `${testUrl}?a=1&${FORCE_URLENCODED_KEY}=1&${transportOpt.rBody}`,
            );
            done();
        });
    });

    it('resolve request is sender return true', (done) => {
        ctx.navigator.onLine = true;
        beaconStub.returns(true);
        const result = anyRequest(ctx, beaconStub, testUrl, transportOpt);
        result.then((res: string) => {
            sinon.assert.calledOnce(beaconStub);
            expect(res).to.be.eq('');
            done();
        });
    });
    it('rejects if query is too long', () => {
        ctx.navigator.onLine = true;
        let rBody = '';
        for (let i = 0; i < 2000; i += 1) {
            rBody += '1';
        }
        const opts = {
            rQuery: {},
            rBody,
        };
        anyRequest(ctx, beaconStub, testUrl, opts).catch((e: any) => {
            sinon.assert.notCalled(beaconStub);
            const errorMessage = e.message;
            assert(
                isKnownError(errorMessage),
                `${errorMessage} is not known error`,
            );
        });
    });
});
