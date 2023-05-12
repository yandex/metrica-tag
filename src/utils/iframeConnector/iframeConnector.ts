import { getHid } from 'src/middleware/watchSyncFlags/brinfoFlags/hid';
import { arrayJoin, cFilter, cForEach, cMap, isArray } from 'src/utils/array';
import { isIframe, isTP } from 'src/utils/browser';
import { getUid } from 'src/utils/uid';
import { CounterOptions, getCounterKey } from 'src/utils/counterOptions';
import { setDefer } from 'src/utils/defer';
import { ctxErrorLogger } from 'src/utils/errorLogger';
import { cEvent, emitter, Emitter } from 'src/utils/events';
import {
    bindArg,
    bindArgs,
    firstArg,
    getNativeFunction,
    isNativeFunction,
    memo,
    noop,
    pipe,
    secondArg,
} from 'src/utils/function';
import { parse, stringify } from 'src/utils/json';
import {
    cKeys,
    ctxMix,
    ctxPath,
    getPath,
    isNil,
    isNull,
    mix,
} from 'src/utils/object';
import { getMs, TimeOne } from 'src/utils/time';
import { taskFork } from '../async';
import { waitForBodyTask } from '../dom/waitForBody';
import { parseDecimalInt } from '../number';
import {
    ConnectorState,
    CounterInfo,
    EventInfo,
    FullMessage,
    Message,
    MessageHandler,
    MessageMeta,
    IframeConnector,
} from './types';

import {
    IFRAME_MESSAGE_TYPE,
    IFRAME_MESSAGE_HID,
    IFRAME_MESSAGE_COUNTER_ID,
    IFRAME_MESSAGE_DUID,
    IFRAME_MESSAGE_DATA,
    IFRAME_MESSAGE_TO_COUNTER,
    NAME_SPACE,
    SEND_TIMEOUT,
    INIT_MESSAGE_CHILD,
    INIT_MESSAGE_PARENT,
    INIT_MESSAGE,
    OUT_DIRECTION,
    SPLITTER,
} from './const';

export const getIframeState = memo((() => ({
    parents: {},
    pending: {},
    children: {},
})) as (ctx: Window) => ConnectorState);

export const checkIframe = ctxPath('postMessage');
export const genMessage =
    (ctx: Window, sigin: CounterInfo) =>
    (metaList: string[], data: Record<string, any>): Message => {
        const meta: MessageMeta = {
            date: TimeOne(ctx)(getMs),
            key: ctx.Math.random(),
            dir: OUT_DIRECTION,
        };
        if (metaList.length) {
            meta.date = parseDecimalInt(metaList[0]);
            meta.key = parseFloat(metaList[1]);
            meta.dir = parseDecimalInt(metaList[2]) as 0 | 1;
        }
        mix(data, sigin);
        const out = {
            data,
            [NAME_SPACE]: arrayJoin(SPLITTER, [
                NAME_SPACE,
                meta.date,
                meta.key,
                meta.dir,
            ]),
        };
        return {
            meta,
            string: stringify(ctx, out) || '',
        };
    };

export const sendToFrame = (
    ctx: Window,
    serialize: (data: Record<string, any>) => Message,
    iframeCtx: Window,
    data: Record<string, any>,
    cb: MessageHandler,
) => {
    const message = serialize(data);
    const state = getIframeState(ctx);
    const key = arrayJoin(SPLITTER, [message.meta.date, message.meta.key]);
    if (!checkIframe(iframeCtx)) {
        return;
    }
    state.pending[key] = cb;
    try {
        iframeCtx.postMessage(message.string, '*');
    } catch (e) {
        delete state.pending[key];
        return;
    }
    setDefer(
        ctx,
        () => {
            delete state.pending[key];
        },
        SEND_TIMEOUT,
        'if.s',
    );
};

const safeSendToFrame: typeof sendToFrame = ctxErrorLogger(
    's.f',
    sendToFrame,
) as any;

export const watchFramesRemoval = (ctx: Window) => {
    if (!isNativeFunction('MutationObserver', ctx.MutationObserver)) {
        return;
    }

    const { children } = getIframeState(ctx);

    // Despite checking is frame deleted, garbage collect frames on each bulk mutation
    const mutationObserver = new ctx.MutationObserver(() => {
        cForEach((key) => {
            // Frame detached from DOM
            if (!getPath(children[key], 'window.window')) {
                delete children[key];
            }
        }, cKeys(children));
    });

    waitForBodyTask(ctx)(
        taskFork(noop, () => {
            mutationObserver.observe(ctx.document.body, {
                subtree: true,
                childList: true,
            });
        }),
    );
};

export const addHandlers = (
    ctx: Window,
    emitterObj: Emitter<EventInfo, void>,
) => {
    const state = getIframeState(ctx);
    emitterObj
        .on([INIT_MESSAGE_PARENT], ([e, data]) => {
            if (window.window) {
                state.children[data[IFRAME_MESSAGE_COUNTER_ID]!] = {
                    info: data,
                    window: e.source as Window,
                };
            }
        })
        .on([INIT_MESSAGE_CHILD], ([e, data]) => {
            if (e.source === ctx.parent) {
                emitterObj.trigger(INIT_MESSAGE, [e, data]);
            }
        })
        .on([INIT_MESSAGE], ([e, data]) => {
            if (!data[IFRAME_MESSAGE_COUNTER_ID]) {
                return;
            }
            state.parents[data[IFRAME_MESSAGE_COUNTER_ID]!] = {
                info: data,
                window: e.source as Window,
            };
        });
};
export const handleInputMessage = (
    ctx: Window,
    opt: CounterOptions,
    serialize: (
        metaList: (string | number)[],
        data: Record<string, any>,
    ) => Message,
    emitterInstance: Emitter<EventInfo, void>,
    counterInfo: CounterInfo,
    event: MessageEvent,
) => {
    let messageInfo: FullMessage | null = null;
    let meta: string | null = null;
    const state = getIframeState(ctx);
    let message = null;
    try {
        messageInfo = parse(ctx, event.data) as FullMessage;
        meta = messageInfo[NAME_SPACE];
        message = messageInfo[IFRAME_MESSAGE_DATA];
    } catch (e) {
        return;
    }
    if (
        isNil(meta) ||
        !meta.substring ||
        meta.substring(0, NAME_SPACE.length) !== NAME_SPACE ||
        isNil(message)
    ) {
        return;
    }
    const metaList = meta.split(SPLITTER);
    if (metaList.length !== 4) {
        return;
    }
    const counterId = opt.id;
    const [, dateInfo, key, direction] = metaList;
    if (
        !isArray(message) &&
        message[IFRAME_MESSAGE_TYPE] &&
        direction === `${OUT_DIRECTION}` &&
        message[IFRAME_MESSAGE_COUNTER_ID]
    ) {
        if (
            !message[IFRAME_MESSAGE_TO_COUNTER] ||
            // eslint-disable-next-line eqeqeq
            message[IFRAME_MESSAGE_TO_COUNTER] == counterId
        ) {
            let returnWinCtx = null;
            try {
                returnWinCtx = event.source as Window;
            } catch (e) {
                // empty
            }
            if (isNull(returnWinCtx) || !checkIframe(returnWinCtx)) {
                return;
            }
            const resp = emitterInstance.trigger(message[IFRAME_MESSAGE_TYPE], [
                event,
                message,
            ]);
            const normResp = cMap(
                pipe(firstArg, ctxMix(counterInfo) as any),
                resp.concat([{}]),
            );
            const data = serialize(
                [dateInfo, key, message[IFRAME_MESSAGE_COUNTER_ID]!],
                normResp,
            );
            returnWinCtx.postMessage(data.string, '*');
        }
    } else if (
        direction === `${counterId}` &&
        isArray(message) &&
        cFilter(
            (e) => !!(e[IFRAME_MESSAGE_HID] && e[IFRAME_MESSAGE_COUNTER_ID]),
            message,
        ).length === message.length
    ) {
        const callback = state.pending[
            arrayJoin(SPLITTER, [dateInfo, key])
        ] as any;
        if (callback) {
            // eslint-disable-next-line prefer-spread
            callback.apply(null, [event].concat(message as any));
        }
    }
};
const safeHandleInputMessage: typeof handleInputMessage = ctxErrorLogger(
    's.fh',
    handleInputMessage,
) as any;

export const iframeConnector = (
    ctx: Window,
    opt: CounterOptions,
): IframeConnector | null => {
    const getElems = getNativeFunction(
        'getElementsByTagName',
        getPath(ctx, 'document'),
    );
    const state = getIframeState(ctx);
    const hasPostMessage = checkIframe(ctx);
    const emitterObj = emitter<EventInfo, void>(ctx);
    const events = cEvent(ctx);
    if (!getElems || !hasPostMessage) {
        return null;
    }
    const iframeList = getElems.call(ctx.document, 'iframe');
    const counterInfo: CounterInfo = {
        [IFRAME_MESSAGE_COUNTER_ID]: opt.id,
        [IFRAME_MESSAGE_HID]: `${getHid(ctx)}`,
    };

    if (isTP(ctx)) {
        counterInfo[IFRAME_MESSAGE_DUID] = getUid(ctx, opt);
    }

    addHandlers(ctx, emitterObj);
    watchFramesRemoval(ctx);
    const serializer = genMessage(ctx, counterInfo) as any;
    const sendInfo = bindArgs(
        [ctx, bindArg([], serializer)],
        safeSendToFrame,
    ) as (
        iframeCtx: Window,
        data: Record<string, any>,
        cb: MessageHandler,
    ) => void;
    cForEach((iframeEl: HTMLIFrameElement) => {
        let ctxWin: null | Window = null;
        try {
            ctxWin = iframeEl.contentWindow;
        } catch (e) {
            // empty
        }
        if (!ctxWin) {
            return;
        }
        sendInfo(
            ctxWin,
            {
                type: INIT_MESSAGE_CHILD,
            },
            (e, data) => {
                emitterObj.trigger(INIT_MESSAGE_PARENT, [e, data]);
            },
        );
    }, iframeList);

    if (isIframe(ctx)) {
        sendInfo(
            ctx.parent,
            {
                type: INIT_MESSAGE_PARENT,
            },
            (e, data) => {
                emitterObj.trigger(INIT_MESSAGE, [e, data]);
            },
        );
    }
    events.on(
        ctx,
        ['message'],
        bindArgs(
            [ctx, opt, serializer, emitterObj, counterInfo],
            safeHandleInputMessage,
        ),
    );
    return {
        emitter: emitterObj,
        parents: state.parents,
        children: state.children,
        sendToFrame: sendInfo,
    };
};
export const counterIframeConnector = memo(
    iframeConnector,
    pipe(secondArg, getCounterKey),
);
