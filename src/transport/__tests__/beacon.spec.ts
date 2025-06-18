import { assert, expect } from 'chai';
import * as sinon from 'sinon';
import { FORCE_URLENCODED_KEY } from 'src/api/common';
import { DEFAULT_COUNTER_TYPE } from 'src/providers/counterOptions/const';
import * as bro from 'src/utils/browser/browser';
import type { CounterOptions } from 'src/utils/counterOptions/types';
import { isKnownError } from 'src/utils/errorLogger/knownError';
import * as func from 'src/utils/function/isNativeFunction/isNativeFunction';
import { request, useBeacon } from '../beacon';
import type { InternalTransportOptions } from '../types';

describe('beacon transport', () => {
    let isNativeStub: sinon.SinonStub<any, any>;
    let isAndroidStub: sinon.SinonStub<any, any>;
    let beaconStub: sinon.SinonStub<any, any>;
    const sandbox = sinon.createSandbox();
    let ctx = {
        navigator: {
            sendBeacon: () => {},
        },
    } as unknown as Window;
    const opt: CounterOptions = {
        id: 123,
        counterType: DEFAULT_COUNTER_TYPE,
    };
    const testUrl = 'testUrl';
    const transportOpt = {
        rQuery: { a: 1 },
        rBody: 'testBody',
    } as unknown as InternalTransportOptions;
    const anyRequest = request;
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
        } as unknown as Window;
    });
    afterEach(() => {
        sandbox.reset();
        sandbox.restore();
    });
    it('checks availability in ctx', () => {
        const result = useBeacon({} as Window, opt);
        sinon.assert.notCalled(isNativeStub);
        expect(result).to.be.false;
    });
    it('false if no beacon', () => {
        const result = useBeacon({} as Window, opt);
        isAndroidStub.returns(false);
        sinon.assert.notCalled(isNativeStub);
        expect(result).to.be.false;
    });
    it('checks native', () => {
        isAndroidStub.returns(false);
        const result = useBeacon(ctx, opt);
        sinon.assert.calledOnce(isNativeStub);
        expect(result).to.be.false;
    });
    it('checks android web view', () => {
        isNativeStub.returns(true);
        isAndroidStub.returns(false);
        const result = useBeacon(ctx, opt);
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
        Object.assign(ctx.navigator, { onLine: true });
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
        Object.assign(ctx.navigator, { onLine: true });
        beaconStub.returns(true);
        const result = anyRequest(ctx, beaconStub, testUrl, transportOpt);
        result.then((res) => {
            sinon.assert.calledOnce(beaconStub);
            expect(res).to.be.eq('');
            done();
        });
    });
    it('rejects if query is too long', () => {
        Object.assign(ctx.navigator, { onLine: true });
        let rBody = '';
        for (let i = 0; i < 2000; i += 1) {
            rBody += '1';
        }
        const opts = {
            rQuery: {},
            rBody,
        } as InternalTransportOptions;
        anyRequest(ctx, beaconStub, testUrl, opts).catch((e) => {
            sinon.assert.notCalled(beaconStub);
            const errorMessage = e.message;
            assert(
                isKnownError(errorMessage),
                `${errorMessage} is not known error`,
            );
        });
    });
});
