import { flags } from '@inject';
import {
    BEACON_TRANSPORT_FEATURE,
    FETCH_FEATURE,
    JSONP_FEATURE,
} from 'generated/features';
import { useBeacon } from './beacon';
import { useJsonp } from './jsonp';
import { useFetch } from './fetch';
import { useXHR } from './xhr';
import { useImage } from './image';
import { CheckTransport } from './types';

export const BEACON_TRANSPORT_ID = 'b';
export const JSONP_TRANSPORT_ID = 'j';
export const FETCH_TRANSPORT_ID = 'f';
export const XHR_TRANSPORT_ID = 'x';
export const IMAGE_TRANSPORT_ID = 'i';

export type TransportInfo = {
    id: number;
    check: CheckTransport;
};
export interface TransportMap {
    [BEACON_TRANSPORT_ID]: TransportInfo;
    [JSONP_TRANSPORT_ID]: TransportInfo;
    [FETCH_TRANSPORT_ID]: TransportInfo;
    [XHR_TRANSPORT_ID]: TransportInfo;
    [IMAGE_TRANSPORT_ID]: TransportInfo;
}

export type TransportId = keyof TransportMap;
export const TRANSPORTS_MAP: Partial<TransportMap> = {
    [XHR_TRANSPORT_ID]: {
        id: 2,
        check: useXHR,
    },
    [IMAGE_TRANSPORT_ID]: {
        id: 4,
        check: useImage,
    },
};

if (flags[FETCH_FEATURE]) {
    TRANSPORTS_MAP[FETCH_TRANSPORT_ID] = {
        id: 1,
        check: useFetch,
    };
}

if (flags[BEACON_TRANSPORT_FEATURE]) {
    TRANSPORTS_MAP[BEACON_TRANSPORT_ID] = {
        id: 0,
        check: useBeacon,
    };
}

if (flags[JSONP_FEATURE]) {
    TRANSPORTS_MAP[JSONP_TRANSPORT_ID] = {
        id: 3,
        check: useJsonp,
    };
}
