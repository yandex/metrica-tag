import * as chai from 'chai';
import * as sinon from 'sinon';
import { DEFER_KEY } from 'src/api/watch';
import * as timeFlags from 'src/middleware/watchSyncFlags/brinfoFlags/timeFlags';
import type { SenderInfo } from 'src/sender/SenderInfo';
import * as gs from 'src/storage/global/getGlobal';
import { CounterOptions } from 'src/utils/counterOptions';
import type { GlobalStorage } from 'src/storage/global/global';
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
    const gsGetValStub = sandbox.stub<
        Parameters<GlobalStorage['getVal']>,
        ReturnType<GlobalStorage['getVal']>
    >();
    const fakeGlobalStorage = {
        getVal: gsGetValStub,
    } as unknown as GlobalStorage;
    // NOTE: Get random counter ID in order to get different memoized states.
    const counterOptions = () =>
        ({
            id: Math.floor(Math.random() * 1000),
            counterType: '0',
        }) as CounterOptions;

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
        const fpTime = firstPaint(win, counterOptions(), {});
        chai.expect(fpTime).to.equal(null);
    });

    it('returns null for nohit', () => {
        const senderParams: SenderInfo = {
            urlParams: { [DEFER_KEY]: 'nohit' },
        };
        const fpTime = firstPaint(
            winWithEntries,
            counterOptions(),
            senderParams,
        );
        chai.expect(fpTime).to.equal(null);
    });

    it('returns null for disabled feature', () => {
        gsGetValStub.withArgs(FIRST_PAINT_ENABLED_GS_KEY).returns(undefined);
        const fpTime = firstPaint(winWithEntries, counterOptions(), {});
        chai.expect(fpTime).to.equal(null);
    });

    it('returns null if first hide event ocurred before first paint', () => {
        gsGetValStub.withArgs(FIRST_HIDE_TIME_GS_KEY).returns(10);
        const fpTime = firstPaint(winWithEntries, counterOptions(), {});
        chai.expect(fpTime).to.equal(null);
        sinon.assert.calledWith(gsGetValStub, FIRST_HIDE_TIME_GS_KEY, Infinity);
    });

    it('returns first paint if getEntriesByType is defined', () => {
        const fpTime = firstPaint(winWithEntries, counterOptions(), {});
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
        const fpTime = firstPaint(win, counterOptions(), {});
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
        const fpTime = firstPaint(win, counterOptions(), {});
        chai.expect(fpTime).to.equal(time - ns);
    });

    it('returns the value once per counter', () => {
        const opts1 = counterOptions();
        const opts2 = counterOptions();
        const fpTime11 = firstPaint(winWithEntries, opts1, {});
        const fpTime21 = firstPaint(winWithEntries, opts2, {});
        const fpTime12 = firstPaint(winWithEntries, opts1, {});
        const fpTime22 = firstPaint(winWithEntries, opts2, {});
        chai.expect(fpTime11).to.equal(time);
        chai.expect(fpTime21).to.equal(time);
        chai.expect(fpTime12).is.null;
        chai.expect(fpTime22).is.null;
    });
});
