import { CounterOptions } from 'src/utils/counterOptions';
import { iframeSender } from 'src/utils/iframeConnector/iframeSender';
import {
    getInnerDataLayer,
    innerDataLayerObserver,
} from 'src/utils/dataLayerObserver';
import { METHOD_NAME_PARAMS } from 'src/providers/params/const';
import { bindArgs, pipe } from 'src/utils/function';
import {
    MessageData,
    IFRAME_MESSAGE_DATA,
    IFRAME_MESSAGE_TYPE,
} from 'src/utils/iframeConnector';
import { getCounterInstance } from 'src/utils/counter';
import { ctxErrorLogger } from 'src/utils/errorLogger';
import { includes } from 'src/utils/array';
import { ctxPath } from 'src/utils/object';

export const INNER_DL_PARAMS = 'params';
export const INNER_PARENT_PARAMS = 'parent';
export const INNER_COUNTER_PARAMS = 'counter';
export const SENDED_KEY = 'sended';

export const paramsHandler = (
    ctx: Window,
    frameSender: NonNullable<ReturnType<typeof iframeSender>>,
    counterOptions: CounterOptions,
    rawEvent: MessageData,
) => {
    const event = rawEvent;
    const counter = getCounterInstance(ctx, counterOptions);
    if (!counter) {
        return;
    }
    const params = event[IFRAME_MESSAGE_DATA];
    const stringCounterId = `${counterOptions.id}`;
    const sended = (event[SENDED_KEY] || []) as string[];
    if (!event[SENDED_KEY]) {
        event[SENDED_KEY] = sended;
    }
    if (includes(stringCounterId, sended) || !counter[METHOD_NAME_PARAMS]) {
        return;
    }
    if (
        !event[INNER_COUNTER_PARAMS] ||
        `${event[INNER_COUNTER_PARAMS]}` === stringCounterId
    ) {
        counter[METHOD_NAME_PARAMS]!(params);
    } else {
        return;
    }
    sended.push(stringCounterId);
    if (event[INNER_PARENT_PARAMS]) {
        frameSender.sendToParents({
            [IFRAME_MESSAGE_TYPE]: INNER_DL_PARAMS,
            [IFRAME_MESSAGE_DATA]: params,
        });
    }
};

/**
 * Forwards messages from advertising network and sends them as visit parameters, iframes also included
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 */
export const useYan = ctxErrorLogger(
    'y.p',
    (ctx: Window, counterOptions: CounterOptions) => {
        const counterFrameSender = iframeSender(ctx, counterOptions);
        if (!counterFrameSender) {
            return;
        }
        const innerDataLayer = getInnerDataLayer(ctx);
        const onParams = bindArgs(
            [ctx, counterFrameSender, counterOptions],
            paramsHandler,
        );
        innerDataLayerObserver(ctx, innerDataLayer, (beforeInitEmitter) => {
            beforeInitEmitter.on([INNER_DL_PARAMS], onParams);
        });
        counterFrameSender.emitter.on(
            [INNER_DL_PARAMS],
            pipe(ctxPath('1'), onParams),
        );
    },
);
