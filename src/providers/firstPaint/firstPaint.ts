import { DEFER_KEY } from 'src/api/watch';
import type { SenderInfo } from 'src/sender/SenderInfo';
import { cFilter } from 'src/utils/array';
import type { CounterOptions } from 'src/utils/counterOptions';
import {
    constructObject,
    equal,
    firstArg,
    memo,
    pipe,
} from 'src/utils/function';
import { ctxPath, getPath, isFunction } from 'src/utils/object';
import { cEvent } from 'src/utils/events';
import { getPerformance } from 'src/utils/time/performance';
import { ctxErrorLogger } from 'src/utils/errorLogger';
import { getGlobalStorage } from 'src/storage/global';
import { timeNavigationStart } from 'src/middleware/watchSyncFlags/brinfoFlags/timeFlags';
import {
    CONTENTFUL_PAINT,
    FIRST_HIDE_TIME_GS_KEY,
    FIRST_PAINT_ENABLED_GS_KEY,
} from './const';

const getFirstPaintTime = (ctx: Window): number | undefined => {
    const getEntriesByType = getPath(ctx, 'performance.getEntriesByType');
    if (isFunction(getEntriesByType)) {
        const data = cFilter(
            pipe(firstArg, ctxPath('name'), equal(CONTENTFUL_PAINT)),
            getEntriesByType.call(ctx.performance, 'paint'),
        );
        if (data.length) {
            return data[0].startTime;
        }
        return undefined;
    }
    const chromeLoadTimes = getPath(ctx, 'chrome.loadTimes');
    const ns = timeNavigationStart(ctx);
    if (isFunction(chromeLoadTimes)) {
        const time: { firstPaintTime: number } = chromeLoadTimes.call(
            ctx['chrome'],
        );
        const fp = getPath(time, 'firstPaintTime')!;
        if (ns && fp) {
            return fp * 1000 - ns;
        }
    }
    const ms = getPath(ctx, 'performance.timing.msFirstPaint');
    if (ms) {
        return ms - ns;
    }
    return undefined;
};

type FirstPaintTimingState = {
    firstPaintTime?: number;
};
const getFirstPaintTimingState = memo(
    constructObject as (ctx: Window) => FirstPaintTimingState,
);

export const firstPaint = (
    ctx: Window,
    counterOptions: CounterOptions,
    senderParams: SenderInfo,
) => {
    // "nohit" won't be processed, thus wait for a real hit.
    if (senderParams.urlParams && senderParams.urlParams[DEFER_KEY]) {
        return null;
    }

    // Opt out for pages rendered in inactive state.
    const { getVal } = getGlobalStorage(ctx);
    if (!getVal(FIRST_PAINT_ENABLED_GS_KEY)) {
        return null;
    }

    // Send the FP timing only once
    const counterInfo = getFirstPaintTimingState(ctx);
    if (counterInfo.firstPaintTime) {
        return null;
    }

    const firstHideTime = getVal(FIRST_HIDE_TIME_GS_KEY, Infinity);
    const firstPaintTime = getFirstPaintTime(ctx);
    if (firstPaintTime && firstHideTime > firstPaintTime) {
        counterInfo.firstPaintTime = firstPaintTime;
        return Math.round(firstPaintTime);
    }
    return null;
};

export const useFirstPaintRaw = (ctx: Window) => {
    const perf = getPerformance(ctx);
    /*
        Don't measure FCP for pages which are:
            - opened in inactive state;
            - switched from before being painted.
        For more info see MOBYANDEXIOS-15582
     */
    if (perf && !ctx.document.hidden) {
        const { setSafe } = getGlobalStorage(ctx);
        // Enable once per pageview
        setSafe(FIRST_PAINT_ENABLED_GS_KEY, 1);
        const unsubscribe = cEvent(ctx).on(
            ctx,
            ['visibilitychange', 'webkitvisibilitychange'],
            () => {
                if (ctx.document.hidden) {
                    setSafe(FIRST_HIDE_TIME_GS_KEY, perf.now());
                    unsubscribe();
                }
            },
        );
    }
};

export const useFirstPaint = ctxErrorLogger('fpi', useFirstPaintRaw);
