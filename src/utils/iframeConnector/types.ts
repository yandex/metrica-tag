import { Emitter } from 'src/utils/events';

import {
    IFRAME_MESSAGE_TYPE,
    IFRAME_MESSAGE_HID,
    IFRAME_MESSAGE_COUNTER_ID,
    IFRAME_MESSAGE_DUID,
    IFRAME_MESSAGE_DATA,
    NAME_SPACE,
} from './const';

export type MessageMeta = {
    date: number;
    key: number;
    dir: number;
};

export type CounterInfo = {
    counterId: number;
    hid: string;
    duid?: string;
};

export type MessageData = {
    [IFRAME_MESSAGE_TYPE]: string;
    [IFRAME_MESSAGE_HID]?: string;
    [IFRAME_MESSAGE_DUID]?: string;
    [IFRAME_MESSAGE_COUNTER_ID]?: number;
    [key: string]: any;
};

export type Message = {
    meta: MessageMeta;
    string: string;
};

export type MessageHandler = (e: Event, ...data: Record<string, any>[]) => any;

export type EventInfo = [MessageEvent, MessageData];

export type IframeInfo = {
    info: MessageData;
    window: Window;
};

export type IframeCollection = Record<string, IframeInfo>;

export type ConnectorState = {
    pending: Record<string, MessageHandler>;
    parents: IframeCollection;
    children: IframeCollection;
};

export type FullMessage = {
    [NAME_SPACE]: string;
    [IFRAME_MESSAGE_DATA]: MessageData | MessageData[];
};

export type BufferItem = {
    sendedTo: string[];
    tryTo: number[];
    resolve?: (a: any) => void;
    reject?: (a: any) => void;
    data: MessageData;
};

export type IframeConnector = {
    emitter: Emitter<EventInfo, void>;
    parents: IframeCollection;
    children: IframeCollection;
    sendToFrame: (
        iframeCtx: Window,
        data: Record<string, any>,
        cb: MessageHandler,
    ) => void;
};
