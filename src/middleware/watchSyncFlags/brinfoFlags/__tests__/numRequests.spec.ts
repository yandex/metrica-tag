import * as chai from 'chai';
import { DEFER_KEY } from 'src/api/watch';
import type { CounterOptions } from 'src/utils/counterOptions';
import type { SenderInfo } from 'src/sender/SenderInfo';
import {
    DEFAULT_COUNTER_TYPE,
    RSYA_COUNTER_TYPE,
} from 'src/providers/counterOptions';
import { numRequests } from '../numRequests';

describe('numRequests', () => {
    let storageMock: Record<string, string> = {};

    const win = {
        JSON,
        localStorage: {
            getItem: (key: string) => storageMock[key] || null,
            setItem: (key: string, value: string) => {
                storageMock[key] = value;
            },
            removeItem: (key: string) => {
                delete storageMock[key];
            },
        },
    } as Window;

    const counterOptions: CounterOptions = {
        id: 11,
        counterType: DEFAULT_COUNTER_TYPE,
    };
    let senderParams: SenderInfo;

    beforeEach(() => {
        senderParams = {
            urlParams: {},
        };
    });

    afterEach(() => {
        storageMock = {};
    });

    it('returns null for no urlParams', () => {
        senderParams = {};
        const requestNumber = numRequests(win, counterOptions, senderParams);
        chai.expect(requestNumber).to.be.null;
    });

    it('returns null for set DEFER_KEY', () => {
        senderParams = {
            urlParams: {
                [DEFER_KEY]: 'defer',
            },
        };
        const requestNumber = numRequests(win, counterOptions, senderParams);
        chai.expect(requestNumber).to.be.null;
    });

    it('returns request number for consecutive calls', () => {
        [1, 2, 3, 4].forEach((expectedNumber) => {
            const requestNumber = numRequests(
                win,
                counterOptions,
                senderParams,
            );
            chai.expect(requestNumber).to.eq(expectedNumber);
        });
    });

    it('track requests for different counterIds separately', () => {
        const secondCounterOptions: CounterOptions = {
            id: counterOptions.id * 100,
            counterType: DEFAULT_COUNTER_TYPE,
        };
        [1, 1, 2, 2].forEach((expectedNumber, index) => {
            const requestNumber = numRequests(
                win,
                index % 2 ? counterOptions : secondCounterOptions,
                senderParams,
            );
            chai.expect(requestNumber).to.eq(expectedNumber);
        });
    });

    it('track requests for different counterClasses on the same CounterId separately', () => {
        const secondCounterOptions: CounterOptions = {
            id: counterOptions.id,
            counterType: RSYA_COUNTER_TYPE,
        };
        [1, 1, 2, 2].forEach((expectedNumber, index) => {
            const requestNumber = numRequests(
                win,
                index % 2 ? counterOptions : secondCounterOptions,
                senderParams,
            );
            chai.expect(requestNumber).to.eq(expectedNumber);
        });
    });
});
