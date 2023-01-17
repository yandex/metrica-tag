import { Tuple } from 'ts-toolbelt';
import { TransportList } from 'src/transport';
import { SenderInfo, InternalSenderInfo } from 'src/sender/SenderInfo';
import { Middleware } from 'src/middleware/types';
import {
    HIT_PROVIDER,
    RETRANSMIT_PROVIDER,
    Provider,
    LOGGER_PROVIDER,
} from 'src/providers';
import {
    SENDER_CLICKMAP,
    SENDER_COLLECT,
    SENDER_MIDDLEWARE,
    SENDER_RETRANSMIT,
    SENDER_WATCH,
} from './const';
import type { SenderWatch } from './watch';

export type SenderRequest = (...args: any[]) => Promise<string | unknown>;

export type SenderType = (
    ctx: Window,
    transports: TransportList,
    middleware: Middleware[],
) => SenderRequest;

/**
 * Collection of senders by provider
 */
export interface NameMap extends Record<Provider, SenderType> {
    [HIT_PROVIDER]: SenderWatch;
    [RETRANSMIT_PROVIDER]: SenderWatch;
    [LOGGER_PROVIDER]: SenderType;
}

type MutateSender<S extends NameMap[keyof NameMap]> = (
    ...args: Parameters<S>
) => (
    opt: SenderInfo,
    ...rest: Tuple.Tail<Parameters<ReturnType<S>>>
) => ReturnType<ReturnType<S>>;

/**
 * Мапа чтобы определить Return Type для GetSender
 */
type ReturnTypeSenderMap = {
    [K in keyof NameMap]: MutateSender<NameMap[K]>;
};

export type AnySender = (
    opt: InternalSenderInfo,
    ...rest: unknown[]
) => unknown;

export type GetSenderType<P extends Provider> = ReturnType<
    ReturnTypeSenderMap[P]
>;

export interface Senders {
    SENDER_CLICKMAP: typeof SENDER_CLICKMAP;
    SENDER_COLLECT: typeof SENDER_COLLECT;
    SENDER_MIDDLEWARE: typeof SENDER_MIDDLEWARE;
    SENDER_RETRANSMIT: typeof SENDER_RETRANSMIT;
    SENDER_WATCH: typeof SENDER_WATCH;
}
export type Sender = Senders[keyof Senders];

export type SenderMap<T> = {
    [sender in Sender]?: T;
};
