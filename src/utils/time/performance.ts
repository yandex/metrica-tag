import { bind } from 'src/utils/function';
import { getPath, isFunction } from 'src/utils/object';

type PerformanceNow = typeof window.performance.now;
type PerformanceInfo = [number, PerformanceNow];

export const getPerformance = (ctx: Window): Performance | null => {
    return getPath(ctx, `performance`) || getPath(ctx, `webkitPerformance`);
};

export const performanceInfo = (ctx: Window): PerformanceInfo => {
    const performance = getPerformance(ctx);
    const ns = getPath(performance, `timing.navigationStart`);
    let now = getPath(performance, `now`);
    if (now) {
        now = bind(now, performance);
    }
    return [ns, now];
};

export const getMsDate = (ctx: Window) => {
    return ctx.Date.now ? ctx.Date.now() : new ctx.Date().getTime();
};

export const getMsFromPerformance = (ctx: Window, info?: PerformanceInfo) => {
    const [ns, now] = info || performanceInfo(ctx);
    // eslint-disable-next-line no-restricted-globals
    if (!isNaN(ns) && isFunction(now)) {
        return Math.round(now() + ns);
    }

    return getMsDate(ctx);
};
