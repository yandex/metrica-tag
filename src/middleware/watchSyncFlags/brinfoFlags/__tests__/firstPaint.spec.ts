import * as chai from 'chai';
import * as sinon from 'sinon';
import * as time from 'src/utils/time';
import { CounterOptions } from 'src/utils/counterOptions';
import { getRandom } from 'src/utils/number';
import { noop } from 'src/utils/function';
import { SenderInfo } from 'src/sender/SenderInfo';
import { browserInfo } from 'src/utils/browserInfo';
import { firstPaint, CONTENTFUL_PAINT } from '../firstPaint';

describe.skip('first paint', () => {
    const win = (
        getEntriesByType: Function | null = noop,
        loadTimes: Function | null = noop,
        msFirstPaint = 0,
    ) => {
        return {
            Array,
            performance: {
                getEntriesByType,
                timing: {
                    msFirstPaint,
                },
            },
            chrome: {
                loadTimes,
            },
        } as any as Window;
    };
    let counterOptions: CounterOptions;
    const senderParams: SenderInfo = {
        brInfo: browserInfo(),
        urlParams: {},
    };
    let timeStub: sinon.SinonStub<any, any>;
    beforeEach(() => {
        timeStub = sinon.stub(time, 'TimeOne');
        counterOptions = {
            id: getRandom(window, 100),
            counterType: '0',
        };
    });
    afterEach(() => {
        timeStub.restore();
    });
    it('return null for empty data', () => {
        const winInfo = win(null, null, 0);
        const navigationStart = getRandom(window, 100);
        timeStub.callsFake((ctx) => {
            chai.expect(ctx).to.be.equal(winInfo);
            return {
                getNs: () => navigationStart,
            };
        });
        const result = firstPaint(winInfo, counterOptions, senderParams);
        chai.expect(result).to.be.null;
    });
    it('collects data for ms browsers', () => {
        const testTime = getRandom(window, 1000);
        const winInfo = win(null, null, testTime);
        const navigationStart = getRandom(window, 100);
        timeStub.callsFake((ctx) => {
            chai.expect(ctx).to.be.equal(winInfo);
            return {
                getNs: () => navigationStart,
            };
        });
        const result = firstPaint(winInfo, counterOptions, senderParams);
        chai.expect(result).to.be.equal(testTime - navigationStart);
        const secondResult = firstPaint(winInfo, counterOptions, senderParams);
        chai.expect(secondResult).to.be.equal(null);
    });
    it.skip('collects data for chrome browsers', () => {
        const testTime = getRandom(window, 1000);
        const winInfo = win(null, () => ({
            firstPaintTime: testTime,
        }));
        const navigationStart = getRandom(window, 100);
        timeStub.callsFake((ctx) => {
            chai.expect(ctx).to.be.equal(winInfo);
            return {
                getNs: () => navigationStart,
            };
        });
        const result = firstPaint(winInfo, counterOptions, senderParams);
        chai.expect(result).to.be.equal(testTime * 1000 - navigationStart);
    });
    it.skip('collects data for actual browsers', () => {
        const testTime = getRandom(window, 1000);
        const winInfo = win(() => {
            return [
                {
                    name: CONTENTFUL_PAINT,
                    startTime: testTime,
                },
            ];
        });
        const navigationStart = getRandom(window, 100);
        timeStub.callsFake((ctx) => {
            chai.expect(ctx).to.be.equal(winInfo);
            return {
                getNs: () => navigationStart,
            };
        });
        const result = firstPaint(winInfo, counterOptions, senderParams);
        chai.expect(result).to.be.equal(testTime);
    });
});
