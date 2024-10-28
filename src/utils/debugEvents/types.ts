import { InternalTransportOptions } from 'src/transport/types';
import { CounterOptions } from 'src/utils/counterOptions';
import { CounterSettings } from 'src/utils/counterSettings/types';

export type DebuggerEventGeneric<N, D> = {
    name: N;
    data: D;
    /** Counter id and type combined  */
    counterKey?: string;
};

export type CommonEvent = DebuggerEventGeneric<
    'event',
    {
        /** How event information stored */
        schema: string;
        /** Event name */
        name: string;
        /** Params attached to event */
        params?: Record<string, unknown>;
    }
>;

export type LogEvent = DebuggerEventGeneric<
    'log',
    {
        type: 'log' | 'warn' | 'error';
        args: unknown[];
        variables?: Record<string, string | number>;
    }
>;

export type RequestEvent = DebuggerEventGeneric<
    'request',
    {
        /** How to enrich data before sending it to transport */
        senderParams: InternalTransportOptions;
        /** Unique identifier */
        requestId: number;
        /** Request URL */
        url: string;
    }
>;

export type RequestFailEvent = DebuggerEventGeneric<
    'requestFail',
    {
        /** Javascript error */
        error: Error;
        /** Unique identifier */
        requestId: number;
    }
>;

export type RequestSuccessEvent = DebuggerEventGeneric<
    'requestSuccess',
    {
        body?: any;
        /** Unique identifier */
        requestId: number;
    }
>;

export type CounterOptionsEvent = DebuggerEventGeneric<
    'counter',
    CounterOptions
>;

export type CounterSettingsEvent = DebuggerEventGeneric<
    'counterSettings',
    {
        /** Settings got from server */
        settings: CounterSettings;
    }
>;

export type ErrorEvent = DebuggerEventGeneric<
    'error',
    {
        /** Error scope */
        scopeName: string;
        /** Javascript error */
        error: Error | string | null | undefined;
    }
>;

export type ParamsEvent = DebuggerEventGeneric<
    'params',
    {
        val: Record<string, any>;
    }
>;

/**
 * A map of possible events that can be passed to the debugger
 */
export interface DebuggerEventsMap {
    /** Log event */
    log: LogEvent;
    /** Request event */
    req: RequestEvent;
    /** Request failure event */
    reqF: RequestFailEvent;
    /** Request success event */
    reqS: RequestSuccessEvent;
    /** Options set by user event */
    countOpt: CounterOptionsEvent;
    /** Settings got from server event */
    countSett: CounterSettingsEvent;
    /** Parameters event */
    params: ParamsEvent;
    /** Error event */
    err: ErrorEvent;
    /** Not specified in map event */
    common: CommonEvent;
}

export type DebuggerEvent = DebuggerEventsMap[keyof DebuggerEventsMap];
