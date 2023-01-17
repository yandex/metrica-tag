import { globalLocalStorage } from 'src/storage/localStorage';
import { CounterTypeInterface } from 'src/utils/counterOptions';
import { globalMemoWin } from 'src/utils/function';

export const LS_PROTOCOL = 'protocol';
export const LS_HOST = 'host';
export const LS_RESOURCE = 'resource';
export const LS_COUNTER = 'counterId';
export const LS_COUNTER_TYPE = 'counterType';
export const LS_POST = 'postParams';
export const LS_PARAMS = 'params';
export const LS_BRINFO = 'browserInfo';
export const LS_TELEMETRY = 'telemetry';
export const LS_TIME = 'time';
export const LS_HID = 'ghid';

export const RETRANSMIT_KEY = 'retryReqs';

// 24 чaca в мс
export const RETRANSMIT_EXPIRE = 24 * 60 * 60 * 1000;

export type RetransmitInfo = {
    // wtf? не испльзуется по назначению
    [LS_PROTOCOL]: string;
    [LS_HOST]: string; // wtf? не используется
    [LS_RESOURCE]: string; // ресурс используется retransmitSender
    [LS_COUNTER]: number;
    [LS_COUNTER_TYPE]: CounterTypeInterface;
    [LS_POST]: any;
    [LS_PARAMS]: Record<string, any>;
    [LS_BRINFO]: Record<string, any>;
    [LS_TELEMETRY]?: Record<string, any>;
    [LS_HID]: number; // see brInfo
    [LS_TIME]: number;
    // далее флаги которые пишутся только в памяти но не в LS
    retransmitIndex?: number; // ls - index
    /* 
        блокировка отправки запроса что
        бы отсылать ретрансмит только 1 счетчиком
        называется d - так что бы поле не обфуцировалось
        по разному в разных сборках скрипта, это важно для
        синхронизации состояния
    */
    d?: number;
};

export const getRetransmitLsState = globalMemoWin(
    RETRANSMIT_KEY,
    (ctx: Window) => {
        const ls = globalLocalStorage(ctx);
        return ls.getVal<Record<string, RetransmitInfo>>(RETRANSMIT_KEY, {})!;
    },
);
