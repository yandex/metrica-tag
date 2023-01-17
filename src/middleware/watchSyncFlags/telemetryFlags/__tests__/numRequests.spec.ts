import * as chai from 'chai';
import { DEFER_KEY } from 'src/api/watch';
import type { CounterOptions } from 'src/utils/counterOptions';
import type { SenderInfo } from 'src/sender/SenderInfo';
import { DEFAULT_COUNTER_TYPE } from 'src/providers/counterOptions';
import { numRequestsTelemetry } from '../numRequests';

describe('numRequests', () => {
    const win = {} as Window;
    let counterId = 11;
    let counterOptions: CounterOptions;
    let senderParams: SenderInfo;

    beforeEach(() => {
        // getNumRequestsIncrementor is memoized on counterKey, thus need to use new key on each run.
        counterId += 1;
        // getCounterKey is memoized on counterOptions, thus need to use new object on each run.
        counterOptions = {
            id: counterId,
            counterType: DEFAULT_COUNTER_TYPE,
        };
    });

    it('returns null for no urlParams', () => {
        senderParams = {};
        const requestNumber = numRequestsTelemetry(
            win,
            counterOptions,
            senderParams,
        );
        chai.expect(requestNumber).to.be.null;
    });

    it('returns null for set DEFER_KEY', () => {
        senderParams = {
            urlParams: {
                [DEFER_KEY]: 'defer',
            },
        };
        const requestNumber = numRequestsTelemetry(
            win,
            counterOptions,
            senderParams,
        );
        chai.expect(requestNumber).to.be.null;
    });

    it('returns request number for consecutive calls', () => {
        senderParams = {
            urlParams: {},
        };
        [1, 2, 3, 4].forEach((expectedNumber) => {
            const requestNumber = numRequestsTelemetry(
                win,
                counterOptions,
                senderParams,
            );
            chai.expect(requestNumber).to.eq(expectedNumber);
        });
    });

    it('track request for different counterKeys separately', () => {
        senderParams = {
            urlParams: {},
        };
        const secondCounterOptions: CounterOptions = {
            id: counterOptions.id * 100,
            counterType: DEFAULT_COUNTER_TYPE,
        };
        [1, 1, 2, 2].forEach((expectedNumber, index) => {
            const requestNumber = numRequestsTelemetry(
                win,
                index % 2 ? counterOptions : secondCounterOptions,
                senderParams,
            );
            chai.expect(requestNumber).to.eq(expectedNumber);
        });
    });
});
