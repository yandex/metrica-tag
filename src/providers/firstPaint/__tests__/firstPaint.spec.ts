import * as chai from 'chai';
import * as sinon from 'sinon';
import * as timeFlags from 'src/middleware/watchSyncFlags/brinfoFlags/timeFlags';
import * as gs from 'src/storage/global';
import { CounterOptions } from 'src/utils/counterOptions';
import { firstPaint } from '../firstPaint';
import { CONTENTFUL_PAINT, FIRST_HIDE_TIME_GS_KEY } from '../const';

describe('first paint', () => {
    const sandbox = sinon.createSandbox();
    const ns = 100;
    const time = 1000;
    const firstHideTime = 5000;
    const fakeGlobalStorage = {
        getVal: sandbox.stub(),
        setVal: sandbox.stub(),
    };
    const counterOptions = {
        id: 123,
        counterType: '0',
    } as unknown as CounterOptions;
    beforeEach(() => {
        fakeGlobalStorage.getVal.returns(firstHideTime);
        sandbox
            .stub(gs, 'getGlobalStorage')
            .returns(fakeGlobalStorage as unknown as gs.GlobalStorage);
        sandbox.stub(timeFlags, 'timeNavigationStart').returns(ns);
    });
    afterEach(() => {
        sandbox.restore();
    });
    it('return null for empty data', () => {
        const win = {} as unknown as Window;
        chai.expect(firstPaint(win, counterOptions, {})).to.equal(null);
    });
    it('return null if first hide event occured before first paint', () => {
        const win = {
            performance: {
                getEntriesByType: (type: string) => {
                    chai.expect(type).to.equal('paint');
                    return [
                        { name: 'aadadsda' },
                        { name: CONTENTFUL_PAINT, startTime: time },
                    ];
                },
            },
        } as unknown as Window;
        fakeGlobalStorage.getVal.returns(10);
        chai.expect(firstPaint(win, counterOptions, {})).to.equal(null);
        sinon.assert.calledWith(
            fakeGlobalStorage.getVal,
            FIRST_HIDE_TIME_GS_KEY,
            Infinity,
        );
    });
    it('returns first paint of getEntriesByType is defined', () => {
        const win = {
            performance: {
                getEntriesByType: (type: string) => {
                    chai.expect(type).to.equal('paint');
                    return [
                        { name: 'aadadsda' },
                        { name: CONTENTFUL_PAINT, startTime: time },
                    ];
                },
            },
        } as unknown as Window;
        chai.expect(firstPaint(win, counterOptions, {})).to.equal(time);
    });
    it('collects data for old chrome browsers', () => {
        const win = {
            chrome: {
                loadTimes: () => ({
                    firstPaintTime: time / 1000,
                }),
            },
        } as unknown as Window;
        chai.expect(firstPaint(win, counterOptions, {})).to.equal(time - ns);
    });
    it('collects data for ms browsers', () => {
        const win = {
            performance: {
                timing: {
                    msFirstPaint: time,
                },
            },
        } as unknown as Window;
        chai.expect(firstPaint(win, counterOptions, {})).to.equal(time - ns);
    });
});
