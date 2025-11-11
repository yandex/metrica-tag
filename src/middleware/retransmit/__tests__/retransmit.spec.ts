import * as sinon from 'sinon';
import { expect } from 'chai';
import { host } from 'src/config';
import { WATCH_URL_PARAM, RETRANSMIT_BRINFO_KEY } from 'src/api/watch';
import { browserInfo } from 'src/utils/browserInfo/browserInfo';
import * as time from 'src/utils/time/time';
import * as localStorage from 'src/storage/localStorage/localStorage';
import * as globalStorage from 'src/storage/global/getGlobal';
import type { CounterOptions } from 'src/utils/counterOptions';
import type { SenderInfo } from 'src/sender/SenderInfo';
import type { LocalStorage } from 'src/storage/localStorage/localStorage';
import { telemetry } from 'src/utils/telemetry/telemetry';
import * as inject from '@inject';
import { TELEMETRY_FEATURE } from 'generated/features';
import { WATCH_RESOURCE } from 'src/middleware/senderWatchInfo';
import type { GlobalStorage } from 'src/storage/global/global';
import { retransmit } from '../retransmit';
import * as state from '../state';
import type { RetransmitInfo } from '../state';
import * as retransmitRequests from '../../../providers/retransmit/sendRetransmitRequests';

describe('retransmit middleware', () => {
    const now = 1123112;
    const HID = 123123123113;
    const sandbox = sinon.createSandbox();

    let localStorageStub: sinon.SinonStub<
        Parameters<typeof localStorage.globalLocalStorage>,
        localStorage.LocalStorage
    >;
    const localStorageSetValMock = sandbox.stub<
        [name: string, val: unknown],
        LocalStorage
    >();
    const mockLocalStorage = {
        setVal: localStorageSetValMock,
    } as unknown as localStorage.LocalStorage;

    let addStub: sinon.SinonStub<
        Parameters<state.RetransmitState['add']>,
        ReturnType<state.RetransmitState['add']>
    >;
    let deleteStub: sinon.SinonStub<
        Parameters<state.RetransmitState['delete']>,
        ReturnType<state.RetransmitState['delete']>
    >;
    let lengthStub: sinon.SinonStub<
        Parameters<state.RetransmitState['length']>,
        ReturnType<state.RetransmitState['length']>
    >;
    let clearStub: sinon.SinonStub<
        Parameters<state.RetransmitState['clear']>,
        ReturnType<state.RetransmitState['clear']>
    >;
    let sendRetransmitRequestsStub: sinon.SinonStub<
        Parameters<typeof retransmitRequests.sendRetransmitRequests>,
        ReturnType<typeof retransmitRequests.sendRetransmitRequests>
    >;

    beforeEach(() => {
        sandbox.stub(inject, 'flags').value({
            ...inject.flags,
            [TELEMETRY_FEATURE]: true,
        });
        sandbox.stub(time, 'TimeOne').returns(<R>() => now as unknown as R);
        addStub = sandbox.stub();
        deleteStub = sandbox.stub();
        lengthStub = sandbox
            .stub<
                Parameters<state.RetransmitState['length']>,
                ReturnType<state.RetransmitState['length']>
            >()
            .returns(0);
        clearStub = sandbox
            .stub<
                Parameters<state.RetransmitState['clear']>,
                ReturnType<state.RetransmitState['clear']>
            >()
            .returns([]);
        sendRetransmitRequestsStub = sandbox.stub();
        sandbox.stub(state, 'getRetransmitState').returns({
            add: addStub,
            delete: deleteStub,
            length: lengthStub,
            clear: clearStub,
            updateRetry: sandbox.stub(),
            getNotExpired: sandbox.stub(),
            clearExpired: sandbox.stub(),
        });
        sandbox
            .stub(retransmitRequests, 'sendRetransmitRequests')
            .value(sendRetransmitRequestsStub);
        sandbox.stub(globalStorage, 'getGlobalStorage').returns({
            getVal: sandbox.stub().returns(HID),
        } as unknown as GlobalStorage);
        localStorageStub = sandbox
            .stub(localStorage, 'globalLocalStorage')
            .returns(mockLocalStorage);
    });

    afterEach(() => {
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
        const retransmitIndex = 1;

        addStub.returns(retransmitIndex);

        const middleware = retransmit(ctx, counterOptions);
        middleware.beforeRequest!(senderParams, next);

        sinon.assert.calledOnceWithExactly(addStub, {
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
            ghid: HID,
            telemetry: {},
        });

        expect(senderParams.middlewareInfo!.retransmitIndex).to.equal(
            retransmitIndex,
        );

        sinon.assert.calledOnce(next);
        next.resetHistory();

        middleware.afterRequest!(senderParams, next);

        sinon.assert.calledOnce(deleteStub);
        sinon.assert.calledWith(deleteStub, retransmitIndex);
        sinon.assert.calledOnce(next);
    });

    it('should call useRetransmitRequests when MAX_REQUESTS is reached', () => {
        const retransmitIndex = 1;
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
            middlewareInfo: {
                retransmitIndex,
            },
        } as SenderInfo;
        const counterOptions: CounterOptions = {
            id: 1234,
            counterType: '0',
        };
        const next = sandbox.stub();

        addStub.returns(retransmitIndex);
        lengthStub.returns(100); // MAX_REQUESTS is 100
        clearStub.returns([{} as RetransmitInfo]);

        const middleware = retransmit(ctx, counterOptions);
        middleware.afterRequest!(senderParams, next);

        sinon.assert.calledOnce(clearStub);
        sinon.assert.calledOnceWithExactly(
            sendRetransmitRequestsStub,
            ctx,
            counterOptions,
            [{} as RetransmitInfo],
        );
    });
});
