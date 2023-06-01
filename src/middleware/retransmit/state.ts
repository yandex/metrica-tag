import { globalLocalStorage } from 'src/storage/localStorage';
import { cForEach } from 'src/utils/array';
import { CounterTypeInterface } from 'src/utils/counterOptions';
import { globalMemoWin } from 'src/utils/function';
import { entries } from 'src/utils/object';
import { getMs, TimeOne } from 'src/utils/time';

export const LS_PROTOCOL = 'protocol';
export const LS_HOST = 'host';
export const LS_RESOURCE = 'resource';
export const LS_COUNTER = 'counterId';
export const LS_COUNTER_TYPE = 'counterType';
export const LS_POST = 'postParams';
export const LS_PARAMS = 'params';
export const LS_BRINFO = 'browserInfo';
export const LS_TELEMETRY = 'telemetry';
export const LS_TIME = 'time';
export const LS_HID = 'ghid';
const LOCKED = 'd';

export const RETRANSMIT_KEY = 'retryReqs';

// 24 hours in ms
export const RETRANSMIT_EXPIRE = 24 * 60 * 60 * 1000;

export type RetransmitInfo = {
    [LS_PROTOCOL]: string; // Not used
    [LS_HOST]: string; // Not used
    [LS_RESOURCE]: string; // Used in retransmitSender
    [LS_COUNTER]: number;
    [LS_COUNTER_TYPE]: CounterTypeInterface;
    [LS_POST]: any;
    [LS_PARAMS]: Record<string, any>;
    [LS_BRINFO]: Record<string, any>;
    [LS_TELEMETRY]?: Record<string, any>;
    [LS_HID]: number; // see brInfo
    [LS_TIME]: number;

    // The following flags are stored in memory only and not in LS
    retransmitIndex?: number; // ls - index
    /** Lock the request for sending by only a single counter. */
    [LOCKED]?: number;
};

type RetransmitStorage = Record<string, RetransmitInfo>;

/**
 * Get the `retryReqs` value from localStorage.
 * The value is retrieved once and then memoized.
 * Feel free to mutate the object.
 */
export const getRetransmitLsState = globalMemoWin(
    RETRANSMIT_KEY,
    (ctx: Window) => {
        const ls = globalLocalStorage(ctx);
        const state = ls.getVal<RetransmitStorage>(RETRANSMIT_KEY, {});

        // On each page load check for expired requests and delete them.
        const time = TimeOne(ctx);
        const currentTime = time(getMs);
        cForEach(([key, req]) => {
            if (
                !req ||
                !req[LS_TIME] ||
                req[LS_TIME] + RETRANSMIT_EXPIRE < currentTime
            ) {
                delete state[key];
            }
        }, entries(state));
        ls.setVal(RETRANSMIT_KEY, state);

        return state;
    },
    true /* NOTE: We need a single storage for ALL counters. 
        Otherwise in case of different version present on a page,
        each version gets its own cache object. The caches quickly diverge
        and upon writing to localStorage each version overwrites the data saved by other versions.
        This function deems stable enough to be version-independent. */,
);

/**
 * Save to localStorage the memory-stored object with requests.
 */
export const saveRetransmitLsState = (ctx: Window) => {
    const retransmitLsRequests = getRetransmitLsState(ctx);
    const ls = globalLocalStorage(ctx);
    ls.setVal(RETRANSMIT_KEY, retransmitLsRequests);
};
