import { BrowserInfo } from 'src/utils/browserInfo';
import { TransportOptions, TransportResponse } from 'src/transport/types';
import { WithRequiredPropertiesDeep } from 'src/utils/types';
import { Telemetry } from 'src/utils/telemetry/telemetry';

export type UrlParams = Record<string, string>;

/**
 * Middleware flags used for processing sender invocations
 */
export interface MiddlewareInfo {
    /** Used in private performance monitoring middleware resourcesTimings */
    force?: boolean;
}

/**
 * Private sender flags used for processing sender invocations
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PrivateSenderInfo {}

export type UrlInfo = {
    hostPrefix?: string;
    hosts?: string[];
    resource?: string;
};

export type SenderInfo = {
    /** Where to send */
    urlInfo?: UrlInfo;
    /** Request flags to be processed by backend */
    brInfo?: BrowserInfo;
    /** Telemetry flags */
    telemetry?: Telemetry;
    /** URL query parameters */
    urlParams?: UrlParams;
    /** Middleware flags used for processing sender invocations */
    middlewareInfo?: MiddlewareInfo;
    /** Private sender flags used for processing sender invocations */
    privateSenderInfo?: PrivateSenderInfo;
    /** Basic options used to form request */
    transportInfo?: TransportOptions;
    responseInfo?: TransportResponse;
    responseUrlIndex?: number;
};

// todo: replace with this inside senders:
export type InternalSenderInfo = WithRequiredPropertiesDeep<
    SenderInfo,
    'transportInfo',
    'debugStack'
>;

export type ReqSenderInfo = {
    [key in keyof SenderInfo]-?: SenderInfo[key];
};
