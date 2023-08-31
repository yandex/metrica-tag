import * as chai from 'chai';
import * as sinon from 'sinon';
import { host } from 'src/config';
import { CLICKMAP_POINTER_PARAM } from 'src/api/clmap';
import { RETRANSMIT_BRINFO_KEY } from 'src/api/common';
import * as time from 'src/utils/time';
import * as localStorage from 'src/storage/localStorage';
import * as globalStorage from 'src/storage/global';
import { CLICKMAP_RESOURCE } from 'src/providers/clickmap/const';
import { WATCH_RESOURCE } from 'src/middleware/senderWatchInfo';
import * as state from 'src/middleware/retransmit/state';
import { startsWithString } from 'src/utils/string/startsWith';
import * as constants from '../const';
import { getRetransmitRequestsRaw } from '../getRetransmitRequests';

describe('getRetransmitRequests', () => {
    const counterId = 123;
    const now = 1123112;
    const HID = 123123123113;
    const CURRENT_HID = 123;
    let lsState: Record<string, Partial<state.RetransmitInfo>> = {};
    const mockLs = {
        getVal: () => lsState,
    } as unknown as localStorage.LocalStorage;
    const sandbox = sinon.createSandbox();
    let timeStub: sinon.SinonStub<
        [ctx: Window],
        <R>(fn: (a: time.TimeState) => R) => R
    >;
    let globalStorageStub: sinon.SinonStub<
        [ctx: Window],
        globalStorage.GlobalStorage
    >;
    let localStorageStub: sinon.SinonStub<
        [ctx: Window, nameSpace?: string | number, prefix?: string],
        localStorage.LocalStorage
    >;

    beforeEach(() => {
        sandbox
            .stub(constants, 'RETRANSMITTABLE_RESOURCE_CALLBACKS')
            .value([
                startsWithString(WATCH_RESOURCE),
                startsWithString(CLICKMAP_RESOURCE),
            ]);
        timeStub = sandbox.stub(time, 'TimeOne');
        sandbox.stub(state, 'getRetransmitLsState').value(() => lsState);
        timeStub.returns(<R>() => now as unknown as R);
        globalStorageStub = sandbox.stub(globalStorage, 'getGlobalStorage');
        globalStorageStub.callsFake(() => {
            return {
                getVal: sinon.stub().returns(CURRENT_HID),
            } as unknown as globalStorage.GlobalStorage;
        });
        localStorageStub = sandbox.stub(localStorage, 'globalLocalStorage');
        localStorageStub.returns(mockLs);
    });

    afterEach(() => {
        lsState = {};
        sandbox.restore();
    });

    it('filters retransmit requests', () => {
        lsState = {
            '1': {
                counterId,
                protocol: 'http:',
                host,
                resource: CLICKMAP_RESOURCE,
                time: now - 1000,
                postParams: undefined,
                counterType: '0',
                params: {
                    [CLICKMAP_POINTER_PARAM]: '4',
                },
                browserInfo: {
                    [RETRANSMIT_BRINFO_KEY]: 0,
                },
                ghid: CURRENT_HID,
            },
            '2': {
                counterId,
                counterType: '0',
                protocol: 'http:',
                host,
                resource: CLICKMAP_RESOURCE,
                time: now - 1000,
                params: {
                    [CLICKMAP_POINTER_PARAM]: '4',
                },
                browserInfo: {
                    [RETRANSMIT_BRINFO_KEY]: 3,
                },
                ghid: HID,
            },
            '3': {
                counterId,
                counterType: '0',
                protocol: 'http:',
                host,
                params: undefined,
                postParams: undefined,
                resource: WATCH_RESOURCE,
                time: now - state.RETRANSMIT_EXPIRE * 2,
                browserInfo: {
                    [RETRANSMIT_BRINFO_KEY]: 0,
                },
                ghid: HID,
            },
            '4': {
                counterId,
                params: undefined,
                postParams: undefined,
                counterType: '0',
                protocol: 'http:',
                host,
                resource: WATCH_RESOURCE,
                time: now - 1000,
                browserInfo: {
                    [RETRANSMIT_BRINFO_KEY]: 2,
                },
                ghid: HID,
            },
            '5': {
                counterId,
                params: undefined,
                postParams: undefined,
                counterType: '0',
                protocol: 'http:',
                host,
                resource: WATCH_RESOURCE,
                time: now,
                browserInfo: {
                    [RETRANSMIT_BRINFO_KEY]: 2,
                },
                ghid: HID,
            },
        };

        const result = getRetransmitRequestsRaw({} as Window);
        chai.expect(result).to.be.deep.eq([
            {
                protocol: 'http:',
                counterType: '0',
                host,
                resource: WATCH_RESOURCE,
                time: now - 1000,
                browserInfo: {
                    [RETRANSMIT_BRINFO_KEY]: 2,
                },
                ghid: HID,
                params: undefined,
                postParams: undefined,
                counterId,
                retransmitIndex: 4,
            },
        ] as Partial<state.RetransmitInfo>[]);
        chai.expect(lsState['4'].d).to.be.ok;
    });
});
