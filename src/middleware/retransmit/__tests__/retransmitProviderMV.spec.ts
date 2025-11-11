import * as chai from 'chai';
import * as sinon from 'sinon';
import * as inject from '@inject';
import { TELEMETRY_FEATURE } from 'generated/features';
import { host } from 'src/config';
import { CLICKMAP_POINTER_PARAM } from 'src/api/clmap';
import { RETRANSMIT_BRINFO_KEY } from 'src/api/common';
import { browserInfo } from 'src/utils/browserInfo/browserInfo';
import { CLICKMAP_RESOURCE } from 'src/providers/clickmap/const';
import * as time from 'src/utils/time/time';
import * as localStorage from 'src/storage/localStorage/localStorage';
import * as globalStorage from 'src/storage/global/getGlobal';
import type { SenderInfo } from 'src/sender/SenderInfo';
import type { CounterOptions } from 'src/utils/counterOptions';
import type { GlobalStorage } from 'src/storage/global/global';
import * as state from '../state';
import { retransmitProviderMiddleware } from '../retransmitProviderMiddleware';

describe('retransmitProviderMiddleware', () => {
    const now = 1123112;
    const HID = 123123123113;
    const sandbox = sinon.createSandbox();

    const localStorageSetValMock = sandbox.stub();
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
    let updateRetryStub: sinon.SinonStub<
        Parameters<state.RetransmitState['updateRetry']>,
        ReturnType<state.RetransmitState['updateRetry']>
    >;
    let getExpiredStub: sinon.SinonStub<
        Parameters<state.RetransmitState['getNotExpired']>,
        ReturnType<state.RetransmitState['getNotExpired']>
    >;

    beforeEach(() => {
        sandbox.stub(inject, 'flags').value({
            ...inject.flags,
            [TELEMETRY_FEATURE]: true,
        });
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
        updateRetryStub = sandbox.stub();
        getExpiredStub = sandbox
            .stub<
                Parameters<state.RetransmitState['getNotExpired']>,
                ReturnType<state.RetransmitState['getNotExpired']>
            >()
            .returns([]);
        sandbox.stub(state, 'getRetransmitState').returns({
            add: addStub,
            delete: deleteStub,
            length: lengthStub,
            clear: clearStub,
            updateRetry: updateRetryStub,
            getNotExpired: getExpiredStub,
            clearExpired: sandbox.stub(),
        });
        sandbox
            .stub(time, 'TimeOne')
            .returns(<R>(fn: (a: any) => R) => now as unknown as R);
        sandbox.stub(globalStorage, 'getGlobalStorage').returns({
            getVal: sinon.stub().returns(HID),
        } as unknown as GlobalStorage);
        sandbox
            .stub(localStorage, 'globalLocalStorage')
            .returns(mockLocalStorage);
    });

    afterEach(() => {
        sandbox.restore();
        localStorageSetValMock.resetHistory();
    });

    it('Increases "rnql" and afterwards removes request from ls', () => {
        const ctx = {
            Array,
        } as Window;
        const counterOptions = {} as CounterOptions;
        const retransmitIndex = 4;
        const brInfoState: state.RetransmitInfo['browserInfo'] = {
            [RETRANSMIT_BRINFO_KEY]: 1,
        };
        const senderParams: SenderInfo = {
            brInfo: browserInfo(brInfoState),
            middlewareInfo: {
                retransmitIndex,
            },
        };
        const retransmitInfo: state.RetransmitInfo = {
            protocol: 'http:',
            host,
            resource: CLICKMAP_RESOURCE,
            time: now,
            params: {
                [CLICKMAP_POINTER_PARAM]: '4',
            },
            browserInfo: {
                [RETRANSMIT_BRINFO_KEY]: 1,
            },
            ghid: HID,
            counterId: 123,
            counterType: '0',
            postParams: undefined,
        };

        getExpiredStub.returns([retransmitInfo]);

        updateRetryStub.callsFake((index, retryCount) => {
            if (index === retransmitIndex) {
                retransmitInfo.browserInfo[RETRANSMIT_BRINFO_KEY] = retryCount;
            }
        });

        const next = sinon.stub();
        const middleware = retransmitProviderMiddleware(ctx, counterOptions);

        middleware.beforeRequest!(senderParams, next);

        chai.expect(next.called).to.be.true;
        chai.expect(
            senderParams.brInfo!.getVal(RETRANSMIT_BRINFO_KEY),
        ).to.equal(2);
        sinon.assert.calledOnceWithExactly(updateRetryStub, retransmitIndex, 2);

        next.resetHistory();

        middleware.afterRequest!(senderParams, next);
        sinon.assert.calledOnce(next);
        sinon.assert.calledOnceWithExactly(deleteStub, retransmitIndex);
    });
});
