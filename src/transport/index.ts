import { TransportFn, CheckTransport } from 'src/transport/types';
import { useXHR } from 'src/transport/xhr';
import { useFetch } from 'src/transport/fetch';
import { cReduce, cFind, filterFalsy, head } from 'src/utils/array';
import {
    Provider,
    ProvidersMap,
    HIT_PROVIDER,
    LOGGER_PROVIDER,
} from 'src/providers';
import { useImage } from 'src/transport/image';
import { useJsonp } from 'src/transport/jsonp';
import { useBeacon } from 'src/transport/beacon';
import {
    BEACON_TRANSPORT_FEATURE,
    FETCH_FEATURE,
    JSONP_FEATURE,
    PREPROD_FEATURE,
} from 'generated/features';
import { throwKnownError } from 'src/utils/errorLogger/knownError';
import { flags } from '@inject';
import { equal, memo, pipe, secondArg } from 'src/utils/function';

export type TransportList = [number, TransportFn][];

export const fetchTransport = flags[FETCH_FEATURE] ? useFetch : 0;
export const jsonpTransport = flags[JSONP_FEATURE] ? useJsonp : 0;
export const beaconTransport = flags[BEACON_TRANSPORT_FEATURE] ? useBeacon : 0;

export type MaybeTransport = CheckTransport | 0;
export const ALL_TRANSPORT_OVERRIDE = '*';
export const transportOverrides: Record<string, CheckTransport[]> = {};

const getTransportOverride = (provider?: Provider) => {
    if (transportOverrides[ALL_TRANSPORT_OVERRIDE]) {
        return transportOverrides[ALL_TRANSPORT_OVERRIDE];
    }

    return provider && transportOverrides[provider];
};

type TransportInfo = [transport: CheckTransport, transportId: number];
export const allTransportsList = filterFalsy<TransportInfo | 0>([
    // beacon особый транспорт он должен идти в списке первым
    beaconTransport && [beaconTransport, 0],
    fetchTransport && [fetchTransport, 1],
    [useXHR, 2],
    jsonpTransport && [jsonpTransport, 3],
    [useImage, 4],
]);

export const fullList = filterFalsy<MaybeTransport>([
    beaconTransport,
    fetchTransport,
    useXHR,
    jsonpTransport,
    useImage,
]);

const hitTransportList: MaybeTransport[] = [useXHR];
if (flags[FETCH_FEATURE]) {
    hitTransportList.unshift(fetchTransport);
}
if (flags[JSONP_FEATURE]) {
    hitTransportList.push(jsonpTransport);
}

export const hitTransports = filterFalsy<MaybeTransport>(hitTransportList);
export const imageTransportOnly = filterFalsy<MaybeTransport>([useImage]);
export const corsTransports = filterFalsy<MaybeTransport>([
    fetchTransport,
    useXHR,
]);
export const queryStringTransports = filterFalsy<MaybeTransport>([
    fetchTransport,
    useImage,
]);
export const withoutBeacon = filterFalsy<MaybeTransport>([
    fetchTransport,
    useXHR,
    jsonpTransport,
    useImage,
]);

/**
 * Mapping between providers and transport lists.
 */
export const nameMap: ProvidersMap<CheckTransport[]> = {
    [HIT_PROVIDER]: hitTransports,
};

if (flags[PREPROD_FEATURE]) {
    nameMap[LOGGER_PROVIDER] = imageTransportOnly;
}

export const EMPTY_TRANSPORT_LIST = 'et';

export const getTransportList = memo((ctx: Window, provider?: Provider) => {
    let transportList: CheckTransport[] | undefined =
        getTransportOverride(provider);

    if (!transportList) {
        if (provider) {
            transportList = nameMap[provider] || [];
        } else {
            transportList = fullList;
        }
    }

    const result = cReduce(
        (list, check) => {
            const checkResult = check(ctx);
            if (checkResult) {
                const info = cFind(pipe(head, equal(check)), allTransportsList);
                if (info) {
                    const transportId = info[1];
                    list.push([transportId, checkResult]);
                }
            }

            return list;
        },
        [] as TransportList,
        transportList,
    );

    if (!result.length) {
        throwKnownError();
    }

    return result;
}, secondArg);
