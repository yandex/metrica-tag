import { TransportFn, CheckTransport } from 'src/transport/types';
import { useXHR } from 'src/transport/xhr';
import { useFetch } from 'src/transport/fetch';
import { cReduce, includes, cMap } from 'src/utils/array';
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
import { memo, secondArg } from 'src/utils/function';

export type TransportList = [number, TransportFn][];

export const fetchProvider = flags[FETCH_FEATURE] ? useFetch : 0;
export const jsonpProvider = flags[JSONP_FEATURE] ? useJsonp : 0;
export const beaconProvider = flags[BEACON_TRANSPORT_FEATURE] ? useBeacon : 0;

type MaybeTransport = CheckTransport | 0;
export const fullList: MaybeTransport[] = [];
export const ALL_TRANSPORT_OVERRIDE = '*';
export const transportOverrides: Record<string, MaybeTransport[]> = {};

const getTransportOverride = (provider?: Provider) => {
    if (transportOverrides[ALL_TRANSPORT_OVERRIDE]) {
        return transportOverrides[ALL_TRANSPORT_OVERRIDE];
    }

    return provider && transportOverrides[provider];
};

// Это нужно чтобы при оптимизации компилятором индексы транспортов всегда были одинаковыми
// beacon особый транспорт он должен идти в списке первым
fullList.push(beaconProvider, fetchProvider, useXHR, jsonpProvider, useImage);

export const getTransportsCheckList = (transports: MaybeTransport[]) => {
    return cMap((transport) => {
        if (!transport || includes(transport, transports)) {
            return transport;
        }
        return 0;
    }, fullList);
};

const hitTransportList: MaybeTransport[] = [useXHR];

if (flags[FETCH_FEATURE]) {
    hitTransportList.unshift(fetchProvider);
}
if (flags[JSONP_FEATURE]) {
    hitTransportList.push(jsonpProvider);
}
export const hitTransports = getTransportsCheckList(hitTransportList);

export const imageTransportOnly = getTransportsCheckList([useImage]);
export const corsTransports = getTransportsCheckList([fetchProvider, useXHR]);
export const queryStringTransports = getTransportsCheckList([
    beaconProvider,
    useImage,
]);
export const withoutBeacon = getTransportsCheckList([
    fetchProvider,
    useXHR,
    jsonpProvider,
    useImage,
]);

/**
 * Mapping between providers and transport lists.
 */
export const nameMap: ProvidersMap<MaybeTransport[]> = {
    [HIT_PROVIDER]: hitTransports,
};

if (flags[PREPROD_FEATURE]) {
    nameMap[LOGGER_PROVIDER] = imageTransportOnly;
}

export const EMPTY_TRANSPORT_LIST = 'et';

export const getTransportList = memo((ctx: Window, provider?: Provider) => {
    let transportList: MaybeTransport[] | undefined =
        getTransportOverride(provider);

    if (!transportList) {
        if (provider) {
            transportList = nameMap[provider] || [];
        } else {
            transportList = fullList;
        }
    }

    const result = cReduce(
        (list, check, id) => {
            const checkResult = check && check(ctx);
            if (checkResult) {
                list.push([id, checkResult]);
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
