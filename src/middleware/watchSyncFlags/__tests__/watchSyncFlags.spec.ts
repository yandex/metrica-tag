import * as chai from 'chai';
import * as sinon from 'sinon';
import {
    DEFER_KEY,
    HID_BR_KEY,
    BUILD_VERSION_BR_KEY,
    LS_ID_BR_KEY,
    COUNTER_NUMBER_BR_KEY,
    COOKIES_ENABLED_BR_KEY,
    DEVICE_PIXEL_RATIO_BR_KEY,
    RANDOM_NUMBER_BR_KEY,
    REQUEST_NUMBER_BR_KEY,
    IS_IFRAME_BR_KEY,
    IS_JAVA_ENABLED_BR_KEY,
    IS_SAME_ORIGIN_AS_TOP_WINDOW_BR_KEY,
    VIEWPORT_SIZE_BR_KEY,
    SCREEN_SIZE_BR_KEY,
    NOINDEX_BR_KEY,
    SECONDS_BR_KEY,
    EVENT_TIME_MS_BR_KEY,
} from 'src/api/watch';
import { browserInfo } from 'src/utils/browserInfo/browserInfo';
import { buildVersion } from 'src/config';
import type { CounterOptions } from 'src/utils/counterOptions';
import * as timeFlags from 'src/middleware/watchSyncFlags/brinfoFlags/timeFlags';
import * as timeUtils from 'src/utils/time/time';
import * as globalStorage from 'src/storage/global/getGlobal';
import * as random from 'src/utils/number/random';
import * as localStorageStorage from 'src/storage/localStorage/localStorage';
import { SenderInfo } from 'src/sender/SenderInfo';
import type { GlobalStorage } from 'src/storage/global/global';
import { REQUEST_NUMBER_KEY, LS_ID_KEY } from '../const';
import { BRINFO_FLAG_GETTERS } from '../brinfoFlags';
import { watchSyncFlags } from '..';
import { COUNTER_NO } from '../brinfoFlags/getCounterNumber';
import { HID_NAME } from '../brinfoFlags/hid';

describe('watchSyncFlags', () => {
    const testHid = 'testHid';
    const testLsID = 11111;
    const randomNumber = 1488;
    const counterOpt: CounterOptions = {
        id: 1,
        counterType: '0',
    };
    const nowMs = 100;
    const navigationStartMs = 1758801234000;
    const senderParams: SenderInfo = {};
    const sandbox = sinon.createSandbox();
    let globalStorageStub: sinon.SinonStub<
        Parameters<typeof globalStorage.getGlobalStorage>,
        ReturnType<typeof globalStorage.getGlobalStorage>
    >;
    let getRandomStub: sinon.SinonStub<
        Parameters<typeof random.getRandom>,
        ReturnType<typeof random.getRandom>
    >;
    const lsGetValStub = sandbox.stub();
    const lsSetValStub = sandbox.stub();
    const lsDelValStub = sandbox.stub();
    const globalGetValStub = sandbox.stub();
    const globalSetValStub = sandbox.stub();
    let timeZoneStub: sinon.SinonStub<
        Parameters<typeof timeFlags.timeZone>,
        ReturnType<typeof timeFlags.timeZone>
    >;
    let timeOneStub: sinon.SinonStub<
        Parameters<typeof timeUtils.TimeOne>,
        ReturnType<typeof timeUtils.TimeOne>
    >;
    let globalLocalStorageStub: sinon.SinonStub<
        Parameters<typeof localStorageStorage.counterLocalStorage>,
        ReturnType<typeof localStorageStorage.counterLocalStorage>
    >;
    beforeEach(() => {
        globalStorageStub = sandbox.stub(globalStorage, 'getGlobalStorage');
        globalStorageStub.returns({
            getVal: globalGetValStub,
            setVal: globalSetValStub,
        } as unknown as GlobalStorage);
        getRandomStub = sandbox.stub(random, 'getRandom');
        getRandomStub.returns(randomNumber);
        timeOneStub = sandbox.stub(timeUtils, 'TimeOne');
        timeOneStub.returns(<T>() => nowMs as unknown as T);
        timeZoneStub = sandbox.stub(timeFlags, 'timeZone');
        timeZoneStub.returns(nowMs);
        globalLocalStorageStub = sandbox.stub(
            localStorageStorage,
            'counterLocalStorage',
        );
        globalLocalStorageStub.returns({
            getVal: lsGetValStub,
            setVal: lsSetValStub,
            delVal: lsDelValStub,
        } as unknown as localStorageStorage.LocalStorage);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it(`sets ${HID_BR_KEY}`, () => {
        const winInfo = {} as Window;
        const fn = BRINFO_FLAG_GETTERS[HID_BR_KEY];
        globalGetValStub.returns(testHid);
        const result = fn(winInfo, counterOpt, {});
        chai.expect(result).to.be.equal(testHid);
        sinon.assert.calledWith(globalGetValStub, HID_NAME);
        globalGetValStub.returns(null);
        const secondResult = fn(winInfo, counterOpt, senderParams);
        chai.expect(secondResult).to.be.equal(randomNumber);
        sinon.assert.calledWith(globalSetValStub, HID_NAME, randomNumber);
    });

    it(`sets ${COUNTER_NUMBER_BR_KEY}`, () => {
        const winInfo = {} as Window;
        const no = 10;
        const expectNo = no + 1;
        globalGetValStub.returns(no);
        const fn = BRINFO_FLAG_GETTERS[COUNTER_NUMBER_BR_KEY];
        const result = fn(winInfo, counterOpt, senderParams);
        chai.expect(result).to.be.equal(expectNo);
        sinon.assert.calledWith(globalSetValStub, COUNTER_NO, expectNo);
    });

    it(`sets ${LS_ID_BR_KEY}`, () => {
        const newCounterOpt = () => Object.assign({}, counterOpt);
        const fn = BRINFO_FLAG_GETTERS[LS_ID_BR_KEY];
        const win = { Math } as Window;
        // 1. Кейс когда запись в ls уже есть
        lsGetValStub.returns(testLsID);
        const result = fn(win, newCounterOpt(), senderParams);
        sinon.assert.calledWith(globalLocalStorageStub, win, counterOpt.id);
        sinon.assert.calledWith(lsGetValStub, LS_ID_KEY);
        chai.expect(result).to.be.equal(testLsID);
        sinon.assert.notCalled(lsSetValStub);

        // 2. кейс, когда записи нет
        lsGetValStub.returns(null);
        const expectNo = 666;
        getRandomStub.returns(expectNo);
        const secondResult = fn(win, newCounterOpt(), senderParams);
        chai.expect(secondResult).to.be.equal(expectNo);
        sinon.assert.calledWith(lsSetValStub, LS_ID_KEY, expectNo);
    });

    it(`sets ${BUILD_VERSION_BR_KEY}`, () => {
        const winInfo = {} as Window;
        chai.expect(
            BRINFO_FLAG_GETTERS[BUILD_VERSION_BR_KEY](
                winInfo,
                counterOpt,
                senderParams,
            ),
        ).to.be.equal(buildVersion);
    });

    it(`sets ${COOKIES_ENABLED_BR_KEY}`, () => {
        const winInfo = {
            navigator: {
                cookieEnabled: true,
            },
        } as Window;
        chai.expect(
            BRINFO_FLAG_GETTERS[COOKIES_ENABLED_BR_KEY](
                winInfo,
                counterOpt,
                senderParams,
            ),
        ).to.be.equal(1);
    });

    // не получится в лоб использовать stub
    // так как функция определяется при импорте
    // и переписать ее не получится
    it(`sets ${RANDOM_NUMBER_BR_KEY}`, () => {
        const winInfo = { Math } as Window;
        const result = BRINFO_FLAG_GETTERS[RANDOM_NUMBER_BR_KEY](
            winInfo,
            counterOpt,
            senderParams,
        );
        chai.expect(typeof result).to.be.equal('number');
    });

    it(`sets ${REQUEST_NUMBER_BR_KEY}`, () => {
        const win = {} as Window;
        const fn = BRINFO_FLAG_GETTERS[REQUEST_NUMBER_BR_KEY];
        let newVal = 0;
        lsSetValStub.callsFake((key, val) => {
            chai.expect(key).to.be.eq(REQUEST_NUMBER_KEY);
            newVal = val;
        });
        lsGetValStub.callsFake((key) => {
            chai.expect(key).to.be.eq(REQUEST_NUMBER_KEY);
            return newVal;
        });
        const result = fn(win, counterOpt, {
            urlParams: {},
        });
        chai.expect(result).to.be.equal(1);
        const secondResult = fn(win, counterOpt, {
            urlParams: { [DEFER_KEY]: '1' },
        });
        chai.expect(secondResult).to.be.equal(null);

        newVal = 1;
        const thirdResult = fn(win, counterOpt, {
            urlParams: {},
        });
        chai.expect(thirdResult).to.be.equal(2);

        lsGetValStub.returns(null);
        sinon.assert.notCalled(lsDelValStub);
        const fourthResult = fn(win, counterOpt, {
            urlParams: {},
        });
        chai.expect(fourthResult).to.be.equal(null);
        sinon.assert.calledWith(lsDelValStub, REQUEST_NUMBER_KEY);
    });

    it(`sets ${VIEWPORT_SIZE_BR_KEY}`, () => {
        const winInfo = {
            document: {
                compatMode: 'CSS1Compat',
                getElementsByTagName: (name: string) => {
                    if (name === 'body') {
                        return [{}];
                    }

                    return null;
                },
                documentElement: {
                    clientHeight: 100,
                    clientWidth: 200,
                },
            } as unknown as Document,
        } as Window;
        chai.expect(
            BRINFO_FLAG_GETTERS[VIEWPORT_SIZE_BR_KEY](
                winInfo,
                counterOpt,
                senderParams,
            ),
        ).to.be.equal('200x100');
    });

    it(`sets ${SCREEN_SIZE_BR_KEY}`, () => {
        const winInfo = {
            screen: {
                width: 100,
                height: 200,
                colorDepth: 10,
            },
        } as Window;
        chai.expect(
            BRINFO_FLAG_GETTERS[SCREEN_SIZE_BR_KEY](
                winInfo,
                counterOpt,
                senderParams,
            ),
        ).to.be.equal('100x200x10');
    });

    it(`sets ${DEVICE_PIXEL_RATIO_BR_KEY}`, () => {
        const winInfo = { devicePixelRatio: 3 } as Window;
        chai.expect(
            BRINFO_FLAG_GETTERS[DEVICE_PIXEL_RATIO_BR_KEY](
                winInfo,
                counterOpt,
                senderParams,
            ),
        ).to.be.equal(3);
    });
    it(`sets ${NOINDEX_BR_KEY}`, () => {
        const winInfo = {
            location: {
                hostname: 'yandex.ru',
            },
        } as Window;
        const urlParams: Record<string, any> = {};
        // @ts-expect-error
        winInfo.top = winInfo;
        BRINFO_FLAG_GETTERS[NOINDEX_BR_KEY](winInfo, counterOpt, {
            urlParams,
        });
        chai.expect(urlParams[NOINDEX_BR_KEY]).to.be.equal('noindex');
    });
    it(`sets ${IS_IFRAME_BR_KEY}`, () => {
        let winInfo = {} as Window;
        // @ts-expect-error
        winInfo.top = winInfo;
        chai.expect(
            BRINFO_FLAG_GETTERS[IS_IFRAME_BR_KEY](
                winInfo,
                counterOpt,
                senderParams,
            ),
        ).to.be.equal(null);

        winInfo = { top: {} } as Window;
        chai.expect(
            BRINFO_FLAG_GETTERS[IS_IFRAME_BR_KEY](
                winInfo,
                counterOpt,
                senderParams,
            ),
        ).to.be.equal(1);
    });

    it(`sets ${IS_JAVA_ENABLED_BR_KEY}`, () => {
        let winInfo = { navigator: { javaEnabled: () => true } } as any;
        chai.expect(
            BRINFO_FLAG_GETTERS[IS_JAVA_ENABLED_BR_KEY](
                winInfo,
                counterOpt,
                senderParams,
            ),
        ).to.be.equal(1);

        winInfo = { navigator: { javaEnabled: () => false } } as any;
        chai.expect(
            BRINFO_FLAG_GETTERS[IS_JAVA_ENABLED_BR_KEY](
                winInfo,
                counterOpt,
                senderParams,
            ),
        ).to.be.equal(null);
    });

    it(`sets ${IS_SAME_ORIGIN_AS_TOP_WINDOW_BR_KEY}`, () => {
        let winInfo = {
            top: {
                contentWindow: {},
            } as unknown as Window,
        } as Window;
        chai.expect(
            BRINFO_FLAG_GETTERS[IS_SAME_ORIGIN_AS_TOP_WINDOW_BR_KEY](
                winInfo,
                counterOpt,
                senderParams,
            ),
        ).to.be.equal('1');

        winInfo = {} as Window;
        chai.expect(
            BRINFO_FLAG_GETTERS[IS_SAME_ORIGIN_AS_TOP_WINDOW_BR_KEY](
                winInfo,
                counterOpt,
                senderParams,
            ),
        ).to.be.equal(null);
    });

    // `timeSeconds`/`timeMilliseconds` capture `TimeOne` via `pipe` at import
    // time, so `timeOneStub` does not affect them and time comes from the
    // context's Performance API. `TimeOne` is memoized per context, hence a
    // fresh context in every test.
    const perfCtx = (now: () => number) =>
        ({
            performance: {
                timing: { navigationStart: navigationStartMs },
                now,
            },
        }) as unknown as Window;

    it(`sets ${EVENT_TIME_MS_BR_KEY}`, () => {
        chai.expect(
            BRINFO_FLAG_GETTERS[EVENT_TIME_MS_BR_KEY](
                perfCtx(() => 567),
                counterOpt,
                senderParams,
            ),
        ).to.be.equal(navigationStartMs + 567);
    });

    it('uses registered event time getters', () => {
        const secondsGetter = sandbox
            .stub(BRINFO_FLAG_GETTERS, SECONDS_BR_KEY)
            .returns(1);
        const millisecondsGetter = sandbox
            .stub(BRINFO_FLAG_GETTERS, EVENT_TIME_MS_BR_KEY)
            .returns(1234);
        const brInfo = browserInfo();
        const nextFn = sandbox.spy();

        watchSyncFlags([SECONDS_BR_KEY, EVENT_TIME_MS_BR_KEY])(
            perfCtx(() => 567),
            counterOpt,
        ).beforeRequest!({ brInfo, urlParams: {} }, nextFn);

        chai.expect(brInfo.getVal(SECONDS_BR_KEY)).to.equal(1);
        chai.expect(brInfo.getVal(EVENT_TIME_MS_BR_KEY)).to.equal(1234);
        sinon.assert.calledOnce(secondsGetter);
        sinon.assert.calledOnce(millisecondsGetter);
        sinon.assert.calledOnce(nextFn);
    });

    it('rounds event time to seconds when the clock is fixed', () => {
        const ctx = perfCtx(() => 567);
        chai.expect(
            BRINFO_FLAG_GETTERS[EVENT_TIME_MS_BR_KEY](
                ctx,
                counterOpt,
                senderParams,
            ),
        ).to.equal(navigationStartMs + 567);
        chai.expect(
            BRINFO_FLAG_GETTERS[SECONDS_BR_KEY](ctx, counterOpt, senderParams),
        ).to.equal(1758801235);
    });

    it('refreshes both event time flags when reusing request parameters', () => {
        const nowStub = sandbox.stub<[], number>().returns(499);
        const brInfo = browserInfo();
        const request = { brInfo, urlParams: {} };
        const nextFn = sandbox.spy();
        const middleware = watchSyncFlags([
            SECONDS_BR_KEY,
            EVENT_TIME_MS_BR_KEY,
        ])(perfCtx(nowStub), counterOpt);

        middleware.beforeRequest!(request, nextFn);
        chai.expect(brInfo.getVal(EVENT_TIME_MS_BR_KEY)).to.equal(
            navigationStartMs + 499,
        );
        chai.expect(brInfo.getVal(SECONDS_BR_KEY)).to.equal(1758801234);

        nowStub.returns(1500);
        middleware.beforeRequest!(request, nextFn);
        chai.expect(brInfo.getVal(EVENT_TIME_MS_BR_KEY)).to.equal(
            navigationStartMs + 1500,
        );
        chai.expect(brInfo.getVal(SECONDS_BR_KEY)).to.equal(1758801236);
        sinon.assert.calledTwice(nextFn);
    });

    it(`does not memoize ${EVENT_TIME_MS_BR_KEY}`, () => {
        let elapsed = 0;
        const ctx = perfCtx(() => {
            elapsed += 100;
            return elapsed;
        });
        const fn = BRINFO_FLAG_GETTERS[EVENT_TIME_MS_BR_KEY];
        const first = fn(ctx, counterOpt, senderParams) as number;
        chai.expect(
            (fn(ctx, counterOpt, senderParams) as number) - first,
        ).to.be.equal(100);
    });

    it('sets determined flags', () => {
        const flags = [COUNTER_NUMBER_BR_KEY, BUILD_VERSION_BR_KEY];
        globalGetValStub.withArgs(COUNTER_NO).returns(1);

        const ctx = {} as Window;
        const brInfo = browserInfo();
        const newCounterOpt: CounterOptions = {
            id: counterOpt.id + 1,
            counterType: '0',
        };
        const nextFn = sinon.spy();
        const mv = watchSyncFlags(flags)(ctx, newCounterOpt);
        mv.beforeRequest!({ brInfo, urlParams: {} }, nextFn);
        sinon.assert.calledOnce(nextFn);
        const flagVal = flags.map((flag) => {
            return brInfo.getVal(flag);
        });
        chai.expect(flagVal).to.include.all.members([2, buildVersion]);
    });
});
