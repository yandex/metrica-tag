import type { WithRequiredProperties } from 'src/utils/types';
import type { CounterOptions } from 'src/utils/counterOptions';

/**
 * Use this type if transportOptions will be transferred to defaultSender
 */
export interface TransportOptions {
    /** HTTP method */
    verb?: string;
    /** Request headers */
    rHeaders?: Record<string, string>;
    /** Request body */
    rBody?: string | Uint8Array;
    /** Request timeout */
    timeOut?: number;
    /** Request query parameters */
    rQuery?: Record<string, string>;
    /** Request mode (true value means we expect server response) */
    wmode?: boolean;
    /** An array of debug scopes */
    debugStack?: (number | string)[];
    /** Should include credentials or not */
    withCreds?: boolean;
    /** Should return raw response */
    returnRawResponse?: boolean;
    /** Needed for some transports that do not require full url */
    resource?: string;
}

export type TransportResponse = Record<string, unknown> | string | null;

/**
 * Использовать этот тип при прямом обращении к транспортам
 */
export type InternalTransportOptions = WithRequiredProperties<
    TransportOptions,
    'debugStack'
>;

export type TransportFn = (
    url: string,
    options: InternalTransportOptions,
) => Promise<TransportResponse>;

export type CheckTransport = (
    ctx: Window,
    counterOptions: CounterOptions,
) => false | TransportFn;
