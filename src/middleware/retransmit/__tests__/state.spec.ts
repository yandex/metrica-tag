import * as chai from 'chai';
import { DEFAULT_COUNTER_TYPE } from 'src/providers/counterOptions/const';
import * as sinon from 'sinon';
import * as time from 'src/utils/time/time';
import * as localStorage from 'src/storage/localStorage/localStorage';
import { RETRANSMIT_BRINFO_KEY } from 'src/api/common';
import * as memoUtils from 'src/utils/function/memo';
import * as globalMemoUtils from 'src/utils/function/globalMemo';
import * as stateFuncs from '../state';
import {
    LS_PROTOCOL,
    LS_HOST,
    LS_TIME,
    LS_BRINFO,
    LS_RESOURCE,
    LS_HID,
    LS_COUNTER,
    LS_COUNTER_TYPE,
    LS_POST,
    RetransmitInfo,
} from '../state';
import { RETRANSMIT_KEY, RETRANSMIT_EXPIRE } from '../const';
import * as watchSyncFlags from '../../watchSyncFlags/brinfoFlags/hid';

describe('getRetransmitState', () => {
    const sandbox = sinon.createSandbox();
    const now = 1000000;

    const mockWindow = {
        Math,
    } as Window;
    let mockLocalStorage: localStorage.LocalStorage;
    let localStorageGetValStub: sinon.SinonStub<
        Parameters<localStorage.LocalStorage['getVal']>,
        ReturnType<localStorage.LocalStorage['getVal']>
    >;
    let localStorageSetValStub: sinon.SinonStub<
        Parameters<localStorage.LocalStorage['setVal']>,
        ReturnType<localStorage.LocalStorage['setVal']>
    >;

    beforeEach(() => {
        localStorageSetValStub = sandbox.stub();
        localStorageGetValStub = sandbox.stub();
        mockLocalStorage = {
            getVal: localStorageGetValStub,
            setVal: localStorageSetValStub,
        } as unknown as localStorage.LocalStorage;

        sandbox
            .stub(localStorage, 'globalLocalStorage')
            .returns(mockLocalStorage);
        sandbox.stub(memoUtils, 'memo').callsFake((fn) => fn);
        sandbox.stub(globalMemoUtils, 'globalMemoWin').callsFake((_, fn) => fn);
        // Stub TimeOne to return a fixed time function
        sandbox.stub(time, 'TimeOne').returns(<R>() => now as unknown as R);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should add a new request and save to localStorage', () => {
        const mockRequests = {};
        localStorageGetValStub.returns(mockRequests);

        const retransmitState = stateFuncs.getRetransmitState(mockWindow);
        const newRequest: RetransmitInfo = {
            [LS_PROTOCOL]: 'https',
            [LS_HOST]: 'example.com',
            [LS_RESOURCE]: 'testResource',
            [LS_COUNTER]: 123,
            [LS_COUNTER_TYPE]: DEFAULT_COUNTER_TYPE,
            [LS_POST]: 'postData',
            [LS_BRINFO]: {},
            [LS_HID]: 456,
            [LS_TIME]: Date.now(),
        };

        const index = retransmitState.add(newRequest);

        // Check that the request was added
        chai.expect(index).to.equal(1); // First index should be 1 (starts from 0)

        sinon.assert.calledOnceWithExactly(
            localStorageSetValStub,
            RETRANSMIT_KEY,
            mockRequests,
        );
    });

    it('should delete a request and save to localStorage', () => {
        const mockRequests: stateFuncs.RetransmitStorage = {
            '2': {
                [LS_RESOURCE]: 'testResource',
                [LS_COUNTER]: 123,
                [LS_COUNTER_TYPE]: DEFAULT_COUNTER_TYPE,
                [LS_POST]: 'postData',
                [LS_BRINFO]: {},
                [LS_HID]: 456,
                [LS_TIME]: Date.now(),
                [LS_PROTOCOL]: 'https',
                [LS_HOST]: 'example.com',
            },
        };
        localStorageGetValStub.returns(mockRequests);

        const retransmitState = stateFuncs.getRetransmitState(mockWindow);
        retransmitState.delete(2);

        // Check that the request was deleted
        chai.expect(mockRequests['2']).to.be.undefined;

        sinon.assert.calledOnceWithExactly(
            localStorageSetValStub,
            RETRANSMIT_KEY,
            mockRequests,
        );
    });

    it('should update retry count and save to localStorage', () => {
        const mockRequests: stateFuncs.RetransmitStorage = {
            '2': {
                [LS_RESOURCE]: 'testResource',
                [LS_COUNTER]: 123,
                [LS_COUNTER_TYPE]: DEFAULT_COUNTER_TYPE,
                [LS_POST]: 'postData',
                [LS_BRINFO]: {
                    [RETRANSMIT_BRINFO_KEY]: 1,
                },
                [LS_HID]: 456,
                [LS_TIME]: Date.now(),
                [LS_PROTOCOL]: 'https',
                [LS_HOST]: 'example.com',
            },
        };
        localStorageGetValStub.returns(mockRequests);

        const retransmitState = stateFuncs.getRetransmitState(mockWindow);
        retransmitState.updateRetry(2, 2);

        // Check that the retry count was updated
        chai.expect(
            mockRequests['2'][LS_BRINFO][RETRANSMIT_BRINFO_KEY],
        ).to.equal(2);

        sinon.assert.calledOnceWithExactly(
            localStorageSetValStub,
            RETRANSMIT_KEY,
            mockRequests,
        );
    });

    it('should return the correct length of requests', () => {
        const mockRequests: stateFuncs.RetransmitStorage = {
            '2': {
                [LS_RESOURCE]: 'testResource',
                [LS_COUNTER]: 123,
                [LS_POST]: 'postData',
                [LS_BRINFO]: {},
                [LS_HID]: 456,
                [LS_TIME]: Date.now(),
                [LS_COUNTER_TYPE]: DEFAULT_COUNTER_TYPE,
                [LS_PROTOCOL]: 'https',
                [LS_HOST]: 'example.com',
            },
            '3': {
                [LS_RESOURCE]: 'testResource2',
                [LS_COUNTER]: 124,
                [LS_COUNTER_TYPE]: DEFAULT_COUNTER_TYPE,
                [LS_POST]: 'postData2',
                [LS_BRINFO]: {},
                [LS_HID]: 457,
                [LS_TIME]: Date.now(),
                [LS_PROTOCOL]: 'https',
                [LS_HOST]: 'example.com',
            },
        };
        localStorageGetValStub.returns(mockRequests);

        const retransmitState = stateFuncs.getRetransmitState(mockWindow);
        const length = retransmitState.length();

        // Check that the length is correct
        chai.expect(length).to.equal(2);
    });

    it('should clear all requests and save to localStorage', () => {
        const mockRequests: stateFuncs.RetransmitStorage = {
            '2': {
                [LS_RESOURCE]: 'testResource',
                [LS_COUNTER]: 123,
                [LS_COUNTER_TYPE]: DEFAULT_COUNTER_TYPE,
                [LS_POST]: 'postData',
                [LS_BRINFO]: {},
                [LS_HID]: 456,
                [LS_TIME]: Date.now(),
                [LS_PROTOCOL]: 'https',
                [LS_HOST]: 'example.com',
            },
        };
        localStorageGetValStub.returns(mockRequests);

        const retransmitState = stateFuncs.getRetransmitState(mockWindow);
        const clearedRequests = retransmitState.clear();

        // Check that the requests were cleared
        chai.expect(Object.keys(mockRequests)).to.have.lengthOf(0);

        // Check that the cleared requests were returned
        chai.expect(clearedRequests).to.have.lengthOf(1);

        sinon.assert.calledOnceWithExactly(
            localStorageSetValStub,
            RETRANSMIT_KEY,
            {},
        );
    });

    it('should return not expired requests that need to be retransmitted', () => {
        // Stub getHid to return a fixed hid
        sandbox.stub(watchSyncFlags, 'getHid').returns(789);

        const mockRequests: stateFuncs.RetransmitStorage = {
            '2': {
                [LS_PROTOCOL]: 'https',
                [LS_HOST]: 'example.com',
                [LS_RESOURCE]: 'pcollect', // This should match RETRANSMITTABLE_RESOURCE_CALLBACKS
                [LS_COUNTER]: 123,
                [LS_COUNTER_TYPE]: DEFAULT_COUNTER_TYPE,
                [LS_POST]: 'postData',
                [LS_BRINFO]: {
                    [RETRANSMIT_BRINFO_KEY]: 1,
                },
                [LS_HID]: 456, // Different from mockWindow hid
                [LS_TIME]: now - 1000, // Older than 500ms but not expired
            },
        };
        localStorageGetValStub.returns(mockRequests);

        const retransmitState = stateFuncs.getRetransmitState(mockWindow);
        const expiredRequests = retransmitState.getNotExpired();

        // Check that the expired requests were returned
        chai.expect(expiredRequests).to.have.lengthOf(1);

        // Check that the request was locked
        chai.expect(mockRequests['2']['d']).to.equal(1);
    });

    it('removes requests without time or expired', () => {
        const expiredTime = now - RETRANSMIT_EXPIRE - 1000; // 1 second more than expired time
        const validTime = now - RETRANSMIT_EXPIRE + 1000;
        const expiredRequests: stateFuncs.RetransmitStorage = {
            '1': {
                [LS_TIME]: null,
            } as unknown as RetransmitInfo,
            '2': {
                [LS_TIME]: undefined,
            } as unknown as RetransmitInfo,
            '3': {
                [LS_TIME]: 0,
            } as unknown as RetransmitInfo,
            '4': {
                // No time field
            } as unknown as RetransmitInfo,
            // expired
            '5': {
                [LS_TIME]: expiredTime,
            } as unknown as RetransmitInfo,
            // RETRANSMIT_BRINFO_KEY >= 2
            '6': {
                [LS_TIME]: validTime,
                [LS_BRINFO]: {
                    [RETRANSMIT_BRINFO_KEY]: 2,
                },
            } as unknown as RetransmitInfo,
        };

        const remainRequests: stateFuncs.RetransmitStorage = {
            '7': {
                [LS_TIME]: validTime,
                [LS_BRINFO]: {
                    [RETRANSMIT_BRINFO_KEY]: 1,
                },
            } as unknown as RetransmitInfo,
        };

        const state = {
            ...expiredRequests,
            ...remainRequests,
        };

        localStorageGetValStub.returns(state);
        const retransmitState = stateFuncs.getRetransmitState(mockWindow);
        retransmitState.clearExpired();

        chai.expect(Object.keys(state)).to.have.lengthOf(1);
        chai.expect(state['7']).to.be.an('object');
    });

    it('saves request to the first empty index in the storage', () => {
        const mockRequests: stateFuncs.RetransmitStorage = {
            '1': {
                [LS_RESOURCE]: 'testResource',
                [LS_COUNTER]: 123,
                [LS_COUNTER_TYPE]: DEFAULT_COUNTER_TYPE,
                [LS_POST]: 'postData',
                [LS_BRINFO]: {},
                [LS_HID]: 456,
                [LS_TIME]: Date.now(),
                [LS_PROTOCOL]: 'https',
                [LS_HOST]: 'example.com',
            },
            '3': {
                [LS_RESOURCE]: 'testResource2',
                [LS_COUNTER]: 124,
                [LS_COUNTER_TYPE]: DEFAULT_COUNTER_TYPE,
                [LS_POST]: 'postData2',
                [LS_BRINFO]: {},
                [LS_HID]: 457,
                [LS_TIME]: Date.now(),
                [LS_PROTOCOL]: 'https',
                [LS_HOST]: 'example.com',
            },
        };
        localStorageGetValStub.returns(mockRequests);

        const newRequest: RetransmitInfo = {
            [LS_PROTOCOL]: 'https',
            [LS_HOST]: 'example.com',
            [LS_RESOURCE]: 'newResource',
            [LS_COUNTER]: 456,
            [LS_COUNTER_TYPE]: DEFAULT_COUNTER_TYPE,
            [LS_POST]: 'newPostData',
            [LS_BRINFO]: {},
            [LS_HID]: 789,
            [LS_TIME]: Date.now(),
        };

        const retransmitState = stateFuncs.getRetransmitState(mockWindow);
        const index1 = retransmitState.add(newRequest);
        const index2 = retransmitState.add(newRequest);

        chai.expect(index1).to.equal(2);
        chai.expect(index2).to.equal(4);
        chai.expect(mockRequests['2']).to.deep.equal(newRequest);
        chai.expect(mockRequests['4']).to.deep.equal(newRequest);

        sinon.assert.calledTwice(localStorageSetValStub);
        sinon.assert.calledWith(
            localStorageSetValStub,
            RETRANSMIT_KEY,
            mockRequests,
        );
    });
});
