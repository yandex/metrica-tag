import * as chai from 'chai';
import * as sinon from 'sinon';
import { DEFER_KEY } from 'src/api/watch';
import * as timeFlags from 'src/middleware/watchSyncFlags/brinfoFlags/timeFlags';
import type { SenderInfo } from 'src/sender/SenderInfo';
import * as gs from 'src/storage/global';
import { CounterOptions } from 'src/utils/counterOptions';
import { firstPaint } from '../firstPaint';
import {
    CONTENTFUL_PAINT,
    FIRST_HIDE_TIME_GS_KEY,
    FIRST_PAINT_ENABLED_GS_KEY,
} from '../const';

describe('first paint', () => {
    const sandbox = sinon.createSandbox();
    const ns = 100;
    const time = 1000;
    const firstHideTime = 5000;
    const gsGetValStub =
        sandbox.stub<
            Parameters<gs.GlobalStorage['getVal']>,
            ReturnType<gs.GlobalStorage['getVal']>
        >();
    const fakeGlobalStorage = {
        getVal: gsGetValStub,
    } as unknown as gs.GlobalStorage;
    const counterOptions = {
        id: 123,
        counterType: '0',
    } as unknown as CounterOptions;

    const winWithEntries = {
        performance: {
            getEntriesByType: (type: string) => [
                { name: 'aadadsda' },
                { name: CONTENTFUL_PAINT, startTime: time },
            ],
        },
    } as Window;

    beforeEach(() => {
        gsGetValStub
            .withArgs(FIRST_PAINT_ENABLED_GS_KEY)
            .returns(1)
            .withArgs(FIRST_HIDE_TIME_GS_KEY)
            .returns(firstHideTime);
        sandbox.stub(gs, 'getGlobalStorage').returns(fakeGlobalStorage);
        sandbox.stub(timeFlags, 'timeNavigationStart').returns(ns);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('returns null for empty data', () => {
        const win = {} as unknown as Window;
        const fpTime = firstPaint(win, counterOptions, {});
        chai.expect(fpTime).to.equal(null);
    });

    it('returns null for nohit', () => {
        const senderParams: SenderInfo = {
            urlParams: { [DEFER_KEY]: 'nohit' },
        };
        const fpTime = firstPaint(winWithEntries, counterOptions, senderParams);
        chai.expect(fpTime).to.equal(null);
    });

    it('returns null for disabled feature', () => {
        gsGetValStub.withArgs(FIRST_PAINT_ENABLED_GS_KEY).returns(undefined);
        const fpTime = firstPaint(winWithEntries, counterOptions, {});
        chai.expect(fpTime).to.equal(null);
    });

    it('returns null if first hide event ocurred before first paint', () => {
        gsGetValStub.withArgs(FIRST_HIDE_TIME_GS_KEY).returns(10);
        const fpTime = firstPaint(winWithEntries, counterOptions, {});
        chai.expect(fpTime).to.equal(null);
        sinon.assert.calledWith(gsGetValStub, FIRST_HIDE_TIME_GS_KEY, Infinity);
    });

    it('returns first paint of getEntriesByType is defined', () => {
        const fpTime = firstPaint(winWithEntries, counterOptions, {});
        chai.expect(fpTime).to.equal(time);
    });

    it('collects data for old chrome browsers', () => {
        const win = {
            chrome: {
                loadTimes: () => ({
                    firstPaintTime: time / 1000,
                }),
            },
        } as unknown as Window;
        const fpTime = firstPaint(win, counterOptions, {});
        chai.expect(fpTime).to.equal(time - ns);
    });

    it('collects data for ms browsers', () => {
        const win = {
            performance: {
                timing: {
                    msFirstPaint: time,
                },
            },
        } as unknown as Window;
        const fpTime = firstPaint(win, counterOptions, {});
        chai.expect(fpTime).to.equal(time - ns);
    });
});
