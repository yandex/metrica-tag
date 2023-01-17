import { getUid, isRecovered } from 'src/utils/uid';
import * as timeUtils from 'src/utils/time';
import * as numberUtils from 'src/utils/number';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as cookieStorage from 'src/storage/cookie';
import * as localStorageStorage from 'src/storage/localStorage';
import { CounterOptions } from 'src/utils/counterOptions';

describe('Uid', () => {
    const testUid = '1234';
    const uidKey = 'uid';
    const windowStub = {} as unknown as Window;
    const counterOptions = {} as unknown as CounterOptions;
    const sandbox = sinon.createSandbox();
    let getRandomMock: sinon.SinonStub;
    let timeUOneMock: sinon.SinonStub;
    let globalCookieStorageMock: sinon.SinonStub;
    let globalLocalStorageMock: sinon.SinonStub;

    beforeEach(() => {
        getRandomMock = sandbox.stub(numberUtils, 'getRandom');
        getRandomMock.returns(20);
        timeUOneMock = sandbox.stub(timeUtils, 'TimeOne');
        timeUOneMock.returns(() => 34);
        globalCookieStorageMock = sandbox.stub(
            cookieStorage,
            'globalCookieStorage',
        );
        globalLocalStorageMock = sandbox.stub(
            localStorageStorage,
            'globalLocalStorage',
        );
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('recover uid from ls', () => {
        const lsUid = 'lsUid';
        globalCookieStorageMock.returns({
            getVal() {
                return null;
            },
            setVal() {},
        });

        globalLocalStorageMock.returns({
            getVal(name: string) {
                if (name === uidKey) {
                    return lsUid;
                }

                return null;
            },
            setVal() {},
        });

        const uid = getUid(windowStub, counterOptions);
        chai.expect(uid).to.be.equal(lsUid);
    });

    it('set uid to localStorage', (done) => {
        globalCookieStorageMock.returns({
            getVal() {
                return testUid;
            },
        });

        globalLocalStorageMock.returns({
            getVal() {
                return null;
            },
            setVal(cookieName: string, uid: string) {
                chai.expect(cookieName).to.equal(uidKey);
                chai.expect(uid).to.equal(uid);
                done();
            },
        });

        const uid = getUid(windowStub, counterOptions);
        chai.expect(uid).to.be.equal(testUid);
    });

    it('do not set uid to cookie with noCookie option', () => {
        const setVal = sinon.stub();
        globalCookieStorageMock.returns({
            getVal() {},
            setVal,
        });
        globalLocalStorageMock.returns({
            getVal() {
                return null;
            },
            setVal() {},
        });

        getUid(windowStub, { noCookie: true } as unknown as CounterOptions);

        sinon.assert.notCalled(setVal);
    });

    it('recovered if ls uid is set', () => {
        const testWindowStub = {} as Window;
        const testVal = 'testLSUid';
        globalCookieStorageMock.returns({
            getVal() {},
        });
        globalLocalStorageMock.returns({
            getVal() {
                return testVal;
            },
        });

        const result = isRecovered(
            testWindowStub,
            {} as unknown as CounterOptions,
        );
        const noCookieResult = isRecovered(testWindowStub, {
            noCookie: true,
        } as unknown as CounterOptions);

        chai.expect(result).to.eq(testVal);
        chai.expect(noCookieResult).to.eq(false);
    });

    it('not recovered if cookie uid is set', () => {
        const testWindowStub = {} as Window;

        globalCookieStorageMock.returns({
            getVal() {
                return 'testCookieUid';
            },
        });
        globalLocalStorageMock.returns({
            getVal() {},
        });

        const result = isRecovered(
            testWindowStub,
            {} as unknown as CounterOptions,
        );

        chai.expect(result).to.eq(false);
    });

    it('not recovered if ls uid is not set', () => {
        const testWindowStub = {} as Window;

        globalCookieStorageMock.returns({
            getVal() {},
        });
        globalLocalStorageMock.returns({
            getVal() {},
        });

        const result = isRecovered(
            testWindowStub,
            {} as unknown as CounterOptions,
        );

        chai.expect(result).to.eq(undefined);
    });

    it('memo recovered value', () => {
        const testWindowStub = {} as Window;

        const getVal = sinon.stub();
        globalCookieStorageMock.returns({
            getVal,
        });
        globalLocalStorageMock.returns({
            getVal() {},
        });

        const testCounterOptions = {} as unknown as CounterOptions;

        isRecovered(testWindowStub, testCounterOptions);
        isRecovered(testWindowStub, testCounterOptions);

        sinon.assert.calledOnce(getVal);
    });
});
