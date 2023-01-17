import { WithRequiredProperties } from 'src/utils/types';

/**
 * Use this type if transportOptions will be transferred to defaultSender
 */
export type TransportOptions = {
    verb?: string;
    rHeaders?: Record<string, string>;
    rBody?: string | Uint8Array;
    timeOut?: number;
    rQuery?: Record<string, string>;
    wmode?: boolean;
    debugStack?: (number | string)[];
    withCreds?: boolean;
    returnRawResponse?: boolean;
};

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

export type CheckTransport = (ctx: Window) => false | TransportFn;
