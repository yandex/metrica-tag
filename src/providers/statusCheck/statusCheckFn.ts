import { includes, cMap } from 'src/utils/array';
import { constructArray } from 'src/utils/function';
import { ctxPath } from 'src/utils/object';
import { getGlobalStorage } from 'src/storage/global';

import { GLOBAL_COUNTERS_METHOD_NAME } from 'src/providers/getCounters/const';
import {
    ExportedCounterInfo,
    GetCountersMethod,
} from 'src/providers/getCounters/types';
import { counterIdForCheck } from './urlSearchParams';

/** Result of checking if counter exists on page */
interface CheckStatusResult {
    /** Counter id */
    id: number;
    /** Is counter present on page */
    counterFound: boolean;
}

export const checkStatusFn = (ctx: Window): CheckStatusResult => {
    const id = counterIdForCheck(ctx);

    const globalConfig = getGlobalStorage(ctx);
    const getCountersFn = globalConfig.getVal<GetCountersMethod>(
        GLOBAL_COUNTERS_METHOD_NAME,
        constructArray,
    );

    const runningCounters = getCountersFn();
    const counterIds = cMap<ExportedCounterInfo, number>(
        ctxPath('id'),
        runningCounters,
    );

    return {
        id,
        ['counterFound']: !!id && includes(id, counterIds),
    };
};
