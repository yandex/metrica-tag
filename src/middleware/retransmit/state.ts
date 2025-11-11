import { globalLocalStorage } from 'src/storage/localStorage/localStorage';
import { CounterTypeInterface } from 'src/utils/counterOptions';
import { globalMemoWin } from 'src/utils/function/globalMemo';
import { cKeys, entries } from 'src/utils/object';
import { getMs, TimeOne } from 'src/utils/time/time';
import { RETRANSMIT_BRINFO_KEY } from 'src/api/common';
import { UrlParams } from 'src/sender/SenderInfo';
import { FlagData } from 'src/utils/flagsStorage/flagsStorage';
import { parseDecimalInt } from 'src/utils/number/number';
import { flags } from '@inject';
import { ctxErrorLogger } from 'src/utils/errorLogger/errorLogger';
import { dirtyReduce } from 'src/utils/array/reduce';
import { cSome } from 'src/utils/array/some';
import { cont } from 'src/utils/function/curry';
import { cForEach } from 'src/utils/array/map';
import { getHid } from '../watchSyncFlags/brinfoFlags/hid';
import {
    RETRANSMITTABLE_RESOURCE_CALLBACKS,
    RETRANSMIT_EXPIRE,
    RETRANSMIT_KEY,
} from './const';

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

export type RetransmitInfo = {
    [LS_PROTOCOL]: string; // Not used
    [LS_HOST]: string; // Not used
    [LS_RESOURCE]: string; // Used in retransmitSender
    [LS_COUNTER]: number;
    [LS_COUNTER_TYPE]: CounterTypeInterface;
    [LS_POST]: string | Uint8Array | undefined;
    [LS_PARAMS]?: UrlParams;
    [LS_BRINFO]: FlagData;
    [LS_TELEMETRY]?: FlagData;
    [LS_HID]: number; // see brInfo
    [LS_TIME]: number;

    // The following flags are stored in memory only and not in LS
    retransmitIndex?: number; // ls - index
    /** Lock the request for sending by only a single counter. */
    [LOCKED]?: number;
    [RETRANSMIT_BRINFO_KEY]?: number;
};

export type RetransmitStorage = Record<string, RetransmitInfo>;

export type RetransmitState = {
    add(req: RetransmitInfo): number;
    delete(retransmitIndex: number): void;
    updateRetry(retransmitIndex: number, currentRetry: number): void;
    getNotExpired(): RetransmitInfo[];
    length(): number;
    clear(): RetransmitInfo[];
    clearExpired(): void;
};

/**
 * Get the `retryReqs` value from localStorage.
 * The value is retrieved once and then memoized.
 * Feel free to mutate the object.
 */
const getRetransmitLsState = globalMemoWin(
    RETRANSMIT_KEY,
    (ctx: Window) => {
        const ls = globalLocalStorage(ctx);
        return ls.getVal<RetransmitStorage>(RETRANSMIT_KEY, {});
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
const saveRetransmitLsState = (ctx: Window, storage: RetransmitStorage) => {
    const ls = globalLocalStorage(ctx);
    ls.setVal(RETRANSMIT_KEY, storage);
};

const formatRequestToObfuscatedKeys = (
    retransmitKey: string,
    req: RetransmitInfo,
) => {
    const parsedRequest: RetransmitInfo = {
        protocol: req[LS_PROTOCOL],
        host: req[LS_HOST],
        resource: req[LS_RESOURCE],
        postParams: req[LS_POST],
        params: req[LS_PARAMS],
        browserInfo: req[LS_BRINFO],
        ghid: req[LS_HID],
        time: req[LS_TIME],
        retransmitIndex: parseDecimalInt(retransmitKey),
        counterId: req[LS_COUNTER],
        counterType: req[LS_COUNTER_TYPE],
    };

    if (flags.TELEMETRY_FEATURE && req[LS_TELEMETRY]) {
        parsedRequest.telemetry = req[LS_TELEMETRY];
    }
    return parsedRequest;
};

export const getRetransmitState = (ctx: Window): RetransmitState => {
    const retransmitLsRequests = getRetransmitLsState(ctx);
    return {
        /**
         * Adds a new request to the retransmit storage.
         * @param newRequest - The request to add.
         * @returns The index of the added request.
         */
        add(newRequest) {
            let retransmitIndex = 1;
            while (retransmitLsRequests[retransmitIndex]) {
                retransmitIndex += 1;
            }
            retransmitLsRequests[retransmitIndex] = newRequest;
            saveRetransmitLsState(ctx, retransmitLsRequests);
            return retransmitIndex;
        },
        /**
         * Deletes a request from the retransmit storage by its index.
         * @param retransmitIndex - The index of the request to delete.
         */
        delete(retransmitIndex) {
            delete retransmitLsRequests[retransmitIndex];
            saveRetransmitLsState(ctx, retransmitLsRequests);
        },
        /**
         * Updates the retry count for a specific request.
         * @param retransmitIndex - The index of the request to update.
         * @param currentRetry - The new retry count.
         */
        updateRetry(retransmitIndex, currentRetry) {
            const request = retransmitLsRequests[retransmitIndex];
            if (request && request[LS_BRINFO]) {
                request[LS_BRINFO][RETRANSMIT_BRINFO_KEY] = currentRetry;
                saveRetransmitLsState(ctx, retransmitLsRequests);
            }
        },
        /**
         * Gets not expired requests for retransmitting and clear expired.
         * @returns An array of expired requests.
         */
        getNotExpired: ctxErrorLogger('g.r', () => {
            const time = TimeOne(ctx);
            const currentTime = time(getMs);
            const hid = getHid(ctx);
            const notExpiredRequests = dirtyReduce(
                (result, [key, req]) => {
                    // save not expired request for retransmitting
                    if (
                        req &&
                        cSome(
                            cont(req[LS_RESOURCE]),
                            RETRANSMITTABLE_RESOURCE_CALLBACKS,
                        ) &&
                        !req[LOCKED] && // Do not handle locked requests
                        req[LS_HID] &&
                        req[LS_HID] !== hid &&
                        req[LS_TIME] &&
                        currentTime - req[LS_TIME] > 500 && // skip the requests that might soon resolve in an iframe
                        req[LS_TIME] + RETRANSMIT_EXPIRE > currentTime &&
                        req[LS_BRINFO][RETRANSMIT_BRINFO_KEY] &&
                        (req[LS_BRINFO][RETRANSMIT_BRINFO_KEY] as number) <= 2
                    ) {
                        req[LOCKED] = 1;
                        const parsedRequest = formatRequestToObfuscatedKeys(
                            key,
                            req,
                        );

                        result.push(parsedRequest);
                    }
                    return result;
                },
                [] as RetransmitInfo[],
                entries(retransmitLsRequests),
            );
            return notExpiredRequests;
        }),
        /**
         * Clears expired requests from the storage.
         */
        clearExpired() {
            const time = TimeOne(ctx);
            const currentTime = time(getMs);
            cForEach(([key, req]) => {
                if (
                    !req ||
                    !req[LS_TIME] ||
                    req[LS_TIME] + RETRANSMIT_EXPIRE < currentTime ||
                    (req[LS_BRINFO][RETRANSMIT_BRINFO_KEY] &&
                        (req[LS_BRINFO][RETRANSMIT_BRINFO_KEY] as number) >= 2)
                ) {
                    delete retransmitLsRequests[key];
                }
            }, entries(retransmitLsRequests));
            saveRetransmitLsState(ctx, retransmitLsRequests);
        },
        /**
         * Returns the number of requests in the storage.
         * @returns The number of requests.
         */
        length() {
            return cKeys(retransmitLsRequests).length;
        },
        /**
         * Clears all requests from the storage and returns them.
         * @returns An array of all requests that were in the storage.
         */
        clear() {
            saveRetransmitLsState(ctx, {});
            return dirtyReduce(
                (result, [key, req]) => {
                    result.push(formatRequestToObfuscatedKeys(key, req));
                    delete retransmitLsRequests[key];
                    return result;
                },
                [] as RetransmitInfo[],
                entries(retransmitLsRequests),
            );
        },
    };
};
