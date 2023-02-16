import * as sinon from 'sinon';
import { host } from 'src/config';
import { WATCH_URL_PARAM, RETRANSMIT_BRINFO_KEY } from 'src/api/watch';
import { browserInfo } from 'src/utils/browserInfo';
import * as time from 'src/utils/time';
import * as localStorage from 'src/storage/localStorage';
import * as globalStorage from 'src/storage/global';
import type { CounterOptions } from 'src/utils/counterOptions';
import type { SenderInfo } from 'src/sender/SenderInfo';
import type { LocalStorage } from 'src/storage/localStorage';
import { telemetry } from 'src/utils/telemetry/telemetry';
import * as inject from '@inject';
import { TELEMETRY_FEATURE } from 'generated/features';
import { WATCH_RESOURCE } from 'src/middleware/senderWatchInfo';
import { retransmit } from '../retransmit';
import * as state from '../state';

describe('retransmit middleware', () => {
    const now = 1123112;
    const HID = 123123123113;
    const sandbox = sinon.createSandbox();

    let localStorageStub: sinon.SinonStub<
        Parameters<typeof localStorage.globalLocalStorage>,
        localStorage.LocalStorage
    >;
    let reqList: Record<string, state.RetransmitInfo> = {};
    const localStorageSetValMock =
        sandbox.stub<[name: string, val: unknown], LocalStorage>();
    const mockLocalStorage = {
        setVal: localStorageSetValMock,
    } as unknown as localStorage.LocalStorage;

    beforeEach(() => {
        sandbox.stub(inject, 'flags').value({
            ...inject.flags,
            [TELEMETRY_FEATURE]: true,
        });
        sandbox.stub(time, 'TimeOne').returns(<R>() => now as unknown as R);
        sandbox.stub(state, 'getRetransmitLsState').value(() => reqList);
        sandbox.stub(globalStorage, 'getGlobalStorage').returns({
            getVal: sandbox.stub().returns(HID),
        } as unknown as globalStorage.GlobalStorage);
        localStorageStub = sandbox
            .stub(localStorage, 'globalLocalStorage')
            .returns(mockLocalStorage);
    });

    afterEach(() => {
        reqList = {};
        sandbox.restore();
        localStorageSetValMock.resetHistory();
    });

    it('skips empty urlParams', () => {
        const ctx = {} as Window;
        const senderParams = {
            browserInfo: browserInfo({}),
        } as SenderInfo;
        const counterOptions = {} as CounterOptions;
        const next = sandbox.stub();

        retransmit(ctx, counterOptions).beforeRequest!(senderParams, next);

        sinon.assert.calledOnce(next);
        sinon.assert.notCalled(localStorageStub);
    });

    it('skips empty brInfo', () => {
        const ctx = {} as Window;
        const senderParams = {
            urlParams: {},
        } as SenderInfo;
        const counterOptions = {} as CounterOptions;
        const next = sandbox.stub();

        retransmit(ctx, counterOptions).beforeRequest!(senderParams, next);

        sinon.assert.calledOnce(next);
        sinon.assert.notCalled(localStorageStub);
    });

    it('registers request for future retransmit and removes it after retransmit', () => {
        const ctx = {
            Array,
        } as Window;
        const senderParams = {
            urlInfo: {
                resource: WATCH_RESOURCE,
            },
            urlParams: {
                [WATCH_URL_PARAM]: 'url',
            },
            brInfo: browserInfo({}),
            telemetry: telemetry({}),
        } as SenderInfo;
        const counterOptions: CounterOptions = {
            id: 1234,
            counterType: '0',
        };
        const next = sandbox.stub();

        const middleware = retransmit(ctx, counterOptions);
        middleware.beforeRequest!(senderParams, next);
        sinon.assert.calledOnceWithExactly(
            localStorageSetValMock,
            state.RETRANSMIT_KEY,
            {
                '1': {
                    counterType: '0',
                    counterId: 1234,
                    protocol: 'http:',
                    host,
                    resource: WATCH_RESOURCE,
                    postParams: undefined,
                    params: {
                        [WATCH_URL_PARAM]: 'url',
                    },
                    time: now,
                    browserInfo: {
                        [RETRANSMIT_BRINFO_KEY]: 1,
                    },
                    telemetry: {},
                    ghid: HID,
                } as Partial<state.RetransmitInfo>,
            },
        );

        sinon.assert.calledOnce(next);
        next.resetHistory();

        middleware.afterRequest!(senderParams, next);

        sinon.assert.calledTwice(localStorageSetValMock);
        sinon.assert.calledWith(
            localStorageSetValMock.getCall(1),
            state.RETRANSMIT_KEY,
            {},
        );
        sinon.assert.calledOnce(next);
    });
});
