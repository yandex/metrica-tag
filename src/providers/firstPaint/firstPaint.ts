import { DEFER_KEY, FIRST_PAINT_BR_KEY } from 'src/api/watch';
import type { SenderInfo } from 'src/sender/SenderInfo';
import { cFilter } from 'src/utils/array';
import { CounterOptions, getCounterKey } from 'src/utils/counterOptions';
import {
    constructObject,
    equal,
    firstArg,
    memo,
    pipe,
} from 'src/utils/function';
import { ctxPath, getPath, isFunction } from 'src/utils/object';
import { BRINFO_FLAG_GETTERS } from 'src/middleware/watchSyncFlags/brinfoFlags';
import { cEvent } from 'src/utils/events';
import { getPerformance } from 'src/utils/time/performance';
import { ctxErrorLogger } from 'src/utils/errorLogger';
import { getGlobalStorage } from 'src/storage/global';
import { timeNavigationStart } from 'src/middleware/watchSyncFlags/brinfoFlags/timeFlags';
import { CONTENTFUL_PAINT, FIRST_HIDE_TIME_GS_KEY } from './const';

const getTime = (ctx: Window): number | undefined => {
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
const getCounterState = memo(
    constructObject as (ctx: Window) => Record<string, number | undefined>,
);

export const firstPaint = (
    ctx: Window,
    counterOptions: CounterOptions,
    senderParams: SenderInfo,
) => {
    if (senderParams.urlParams && senderParams.urlParams[DEFER_KEY]) {
        return null;
    }
    const key = getCounterKey(counterOptions);
    const counterInfo = getCounterState(ctx);
    if (counterInfo[key]) {
        return null;
    }
    const firstHideTime = getGlobalStorage(ctx).getVal(
        FIRST_HIDE_TIME_GS_KEY,
        Infinity,
    );
    const time = getTime(ctx);
    if (time && firstHideTime > time) {
        counterInfo[key] = time;
        return Math.round(time);
    }
    return null;
};

export const useFirstPaintRaw = (ctx: Window) => {
    const perf = getPerformance(ctx);
    // This is needed to not measure FCP for pages which are opened in inactive state
    // For more info see MOBYANDEXIOS-15582
    if (perf && !ctx.document.hidden) {
        const unsubscribe = cEvent(ctx).on(
            ctx,
            ['visibilitychange', 'webkitvisibilitychange'],
            () => {
                if (ctx.document.hidden) {
                    getGlobalStorage(ctx).setVal(
                        FIRST_HIDE_TIME_GS_KEY,
                        perf.now(),
                    );
                    unsubscribe();
                }
            },
        );
        BRINFO_FLAG_GETTERS[FIRST_PAINT_BR_KEY] = firstPaint;
    }
};

export const useFirstPaint = ctxErrorLogger('fpi', useFirstPaintRaw);
