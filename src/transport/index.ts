import { TransportFn } from 'src/transport/types';
import { cReduce } from 'src/utils/array/reduce';
import { Provider, ProvidersMap, HIT_PROVIDER } from 'src/providers';
import { throwKnownError } from 'src/utils/errorLogger/knownError';
import { flags } from '@inject';
import { memo } from 'src/utils/function/memo';
import { secondArg } from 'src/utils/function/identity';
import {
    BEACON_TRANSPORT_ID,
    FETCH_TRANSPORT_ID,
    IMAGE_TRANSPORT_ID,
    JSONP_TRANSPORT_ID,
    TRANSPORTS_MAP,
    TransportId,
    TransportInfo,
    XHR_TRANSPORT_ID,
} from './transportsMap';

export type TransportList = [number, TransportFn][];
export const ALL_TRANSPORT_OVERRIDE = '*';
export const transportOverrides: Record<string, TransportId[]> = {};

const mapTransportList = (transportIds?: TransportId[]) => {
    if (!transportIds) {
        return undefined;
    }
    return cReduce<TransportId, TransportInfo[]>(
        (result, transport) => {
            const transportInfo = TRANSPORTS_MAP[transport];
            if (transportInfo) {
                result.push(transportInfo);
            }

            return result;
        },
        [],
        transportIds,
    );
};

const getTransportOverride = (provider?: Provider) => {
    if (transportOverrides[ALL_TRANSPORT_OVERRIDE]) {
        return mapTransportList(transportOverrides[ALL_TRANSPORT_OVERRIDE]);
    }

    return provider
        ? mapTransportList(transportOverrides[provider])
        : undefined;
};

export const fullList: TransportId[] = [
    BEACON_TRANSPORT_ID,
    FETCH_TRANSPORT_ID,
    XHR_TRANSPORT_ID,
    JSONP_TRANSPORT_ID,
    IMAGE_TRANSPORT_ID,
];

const hitTransportList: TransportId[] = [XHR_TRANSPORT_ID];
if (flags.FETCH_FEATURE) {
    hitTransportList.unshift(FETCH_TRANSPORT_ID);
}
if (flags.JSONP_FEATURE) {
    hitTransportList.push(JSONP_TRANSPORT_ID);
}

export const hitTransports: TransportId[] = hitTransportList;
export const imageTransportOnly: TransportId[] = [IMAGE_TRANSPORT_ID];
export const corsTransports: TransportId[] = [
    FETCH_TRANSPORT_ID,
    XHR_TRANSPORT_ID,
];
export const queryStringTransports: TransportId[] = [
    FETCH_TRANSPORT_ID,
    IMAGE_TRANSPORT_ID,
];
export const withoutBeacon: TransportId[] = [
    FETCH_TRANSPORT_ID,
    XHR_TRANSPORT_ID,
    JSONP_TRANSPORT_ID,
    IMAGE_TRANSPORT_ID,
];

/**
 * Mapping between providers and transport lists.
 */
export const nameMap: ProvidersMap<TransportId[]> = {
    [HIT_PROVIDER]: hitTransports,
};

export const EMPTY_TRANSPORT_LIST = 'et';

export const getTransportList = memo(
    (
        ctx: Window,
        provider?: Provider,
        manuallySetTransports?: TransportId[],
    ) => {
        let transportList: TransportInfo[] | undefined =
            getTransportOverride(provider) ||
            mapTransportList(manuallySetTransports);

        if (!transportList) {
            const transportIds = provider ? nameMap[provider] : fullList;
            transportList = mapTransportList(transportIds);
        }

        const result = cReduce<TransportInfo, TransportList>(
            (list, { check, id }) => {
                const checkResult = check(ctx);
                if (checkResult) {
                    list.push([id, checkResult]);
                }

                return list;
            },
            [],
            transportList || [],
        );

        if (!result.length) {
            throwKnownError();
        }

        return result;
    },
    secondArg,
);
