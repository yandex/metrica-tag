import { arrayJoin, cMap } from 'src/utils/array';
import { cEvent } from 'src/utils/events';
import { cont, memo } from 'src/utils/function';
import { perfomanceInfo, getMsFromPerfomance } from './performance';

const leadingZeroFormatter = (n: number) => {
    return (n < 10 ? '0' : '') + n;
};

const EVENT_TIME_DELTA = 50;

export type TimeState = {
    ctx: Window;
    unloadTime: number;
    perf: [number, () => number];
    initTime: number;
};

const Time = (ctx: Window): (<R>(fn: (a: TimeState) => R) => R) => {
    const event = cEvent(ctx);
    const perf = perfomanceInfo(ctx);
    const timeState = {
        ctx,
        unloadTime: 0,
        perf,
        initTime: getMsFromPerfomance(ctx, perf),
    };

    /**
     * защита от ошибки "too much time spent in unload handler"
     * может возникать в firefox, при вызове new Date в beforeunload
     *
     * если доступен perf api, то ничего делать не надо
     * иначе запоминаем время на первом unload
     * и при следующих вызовах getMs не высчитываем заново, а возвращаем сохраненное
     */
    const [ns, now] = perf;

    if (!(ns && now)) {
        event.on(ctx, ['beforeunload', 'unload'], () => {
            if (timeState.unloadTime === 0) {
                timeState.unloadTime = getMsFromPerfomance(ctx, timeState.perf);
            }
        });
    }

    return cont(timeState);
};
export const getNs = (timeState: TimeState) => {
    const [ns] = timeState.perf;
    return ns;
};
export const getMs = (timeState: TimeState) => {
    const { ctx, unloadTime, perf } = timeState;
    if (unloadTime !== 0) {
        return unloadTime;
    }
    return getMsFromPerfomance(ctx, perf);
};
export const initTime = (timeState: TimeState) => {
    return timeState.initTime;
};
export const getTimestamp = (timeState: TimeState) => {
    const { ctx } = timeState;
    const date = new ctx.Date();
    const dateInfo = [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
    ];
    return arrayJoin('', cMap(leadingZeroFormatter, dateInfo));
};
export const getTimezone = (timeState: TimeState) => {
    const { ctx } = timeState;
    return -new ctx.Date().getTimezoneOffset();
};
export const getMin = (timeState: TimeState) => {
    return Math.floor(getMs(timeState) / 1000 / 60);
};
export const getSec = (timeState: TimeState) => {
    return Math.round(getMs(timeState) / 1000);
};
export const getFromStart = (timeState: TimeState) => {
    let out: number;
    const [ns, now] = timeState.perf;
    if (ns && now) {
        out = now();
    } else {
        out = getMs(timeState) - timeState.initTime;
    }
    return Math.round(out);
};
export const TimeOne = memo(Time);

// Этот метод используется только в первом вебвизоре
// В самом плеере происходит домножение на EVENT_TIME_DELTA
// Время измеряется в тиках по 50мс
export const getVisorNowEventTime = (ctx: Window) => {
    const timeOne = TimeOne(ctx);
    return Math.round(timeOne(getFromStart) / EVENT_TIME_DELTA);
};
export { Time };
