import { DEFER_KEY } from 'src/api/watch';
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
import { timeNavigationStart } from './timeFlags';

export const CONTENTFUL_PAINT = 'first-contentful-paint';

const getTime = (ctx: Window): number | undefined => {
    const ns = timeNavigationStart(ctx);
    const getEntriesByType = getPath(ctx, 'performance.getEntriesByType');
    if (isFunction(getEntriesByType)) {
        const data = cFilter(
            pipe(firstArg, ctxPath('name'), equal(CONTENTFUL_PAINT)),
            getEntriesByType.call(ctx.performance, 'paint'),
        ) as { startTime: number }[];
        if (data.length) {
            return data[0].startTime;
        }
        return undefined;
    }
    const chromeLoadTimes = getPath(ctx, 'chrome.loadTimes');
    if (isFunction(chromeLoadTimes)) {
        const time: { firstPaintTime: number } = chromeLoadTimes.call(
            ctx['chrome'],
        );
        const fp: number = getPath(time, 'firstPaintTime');
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
    const time = getTime(ctx);
    if (time) {
        counterInfo[key] = time;
        return Math.round(time);
    }
    return null;
};
