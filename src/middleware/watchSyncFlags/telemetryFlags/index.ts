import { flags } from '@inject';
import {
    MAIN_THREAD_BLOCKING_TIME_TEL_FEATURE,
    METHODS_CALLED_TEL_KEY,
    REQUEST_NUMBER_TEL_KEY,
    CLMAP_CLICKS_TEL_KEY,
} from 'src/api/watch';
import { getGlobalStorage } from 'src/storage/global/getGlobal';
import { entries } from 'src/utils/object';
import { cReduce } from 'src/utils/array/reduce';
import { getMainThreadBlockingTime } from 'src/utils/errorLogger/executionTimeErrorDecorator';
import { GLOBAL_STORAGE_CLICKS_KEY } from 'src/providers/clickmap/const';
import { METHODS_TELEMETRY_GLOBAL_STORAGE_KEY } from 'src/utils/methodDecorators/telCallCount/const';
import { globalStorage } from 'src/storage/global/global';
import { FlagGettersHash } from '../const';
import { numRequestsTelemetry } from './numRequests';

export const TELEMETRY_FLAG_GETTERS: FlagGettersHash = {};

if (flags.TELEMETRY_FEATURE) {
    TELEMETRY_FLAG_GETTERS[METHODS_CALLED_TEL_KEY] = (ctx: Window) => {
        const methodCallCounters: Record<string, number> = globalStorage(
            ctx,
        ).getVal(METHODS_TELEMETRY_GLOBAL_STORAGE_KEY, {});
        const counters = entries(methodCallCounters);
        if (counters.length) {
            return cReduce(
                (carry, [key, val], index) => {
                    return `${carry}${index ? '-' : ''}${key}-${val}`;
                },
                '',
                counters,
            );
        }

        return null;
    };

    if (flags.CLICK_MAP_FEATURE && !flags.SENDER_COLLECT_FEATURE) {
        TELEMETRY_FLAG_GETTERS[CLMAP_CLICKS_TEL_KEY] = (ctx: Window) => {
            const { clicks, x, y } = getGlobalStorage(ctx).getVal<{
                x: number;
                y: number;
                clicks: number;
            }>(GLOBAL_STORAGE_CLICKS_KEY, { clicks: 0, x: 0, y: 0 });
            if (clicks) {
                return `${clicks}-${ctx.Math.floor(
                    x / clicks,
                )}-${ctx.Math.floor(y / clicks)}`;
            }

            return `${clicks}-${x}-${y}`;
        };
    }

    if (flags.PREPROD_FEATURE) {
        TELEMETRY_FLAG_GETTERS[MAIN_THREAD_BLOCKING_TIME_TEL_FEATURE] =
            getMainThreadBlockingTime;
    }

    if (flags.TELEMETRY_REQUEST_ENUMERATION_FEATURE) {
        TELEMETRY_FLAG_GETTERS[REQUEST_NUMBER_TEL_KEY] = numRequestsTelemetry;
    }
}
