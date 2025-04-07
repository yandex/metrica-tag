import { flags } from '@inject';
import {
    CLICKMAP_POINTER_PARAM,
    CLICKMAP_URL_PARAM,
    HIT_TYPE_POINTER_CLICK,
} from 'src/api/clmap';
import {
    COUNTER_ID_PARAM,
    HIT_TYPE_KEY,
    EVENT_ACTION_KEY,
    EVENT_LABEL_KEY,
    HIT_TYPE_EVENT,
} from 'src/api/common';
import { counterStateGetter } from 'src/providers/getCounters/getCounters';
import { COUNTER_STATE_CLICKMAP } from 'src/providers/getCounters/const';
import { getSender } from 'src/sender';
import { SenderInfo, UrlParams } from 'src/sender/SenderInfo';
import { GetSenderType } from 'src/sender/types';
import { getGlobalStorage } from 'src/storage/global/getGlobal';
import { includes } from 'src/utils/array/includes';
import { cSome } from 'src/utils/array/some';
import { arrayJoin } from 'src/utils/array/join';
import { cMap } from 'src/utils/array/map';
import { isBrokenFromCharCode } from 'src/utils/browser/browser';
import { browserInfo } from 'src/utils/browserInfo/browserInfo';
import { CounterOptions, getCounterKey } from 'src/utils/counterOptions';
import {
    getElementPath,
    getElementSize,
    getElementXY,
} from 'src/utils/dom/element';
import { ctxErrorLogger, errorLogger } from 'src/utils/errorLogger/errorLogger';
import { cEvent } from 'src/utils/events/events';
import { bindArg } from 'src/utils/function/bind';
import type { AnyFunc } from 'src/utils/function/types';
import { getLocation } from 'src/utils/location/location';
import { getMouseButton, getPosition } from 'src/utils/mouseEvents/mouseEvents';
import { getRandom } from 'src/utils/number/random';
import { ctxPath, getPath, has, isUndefined } from 'src/utils/object';
import { getMs, TimeOne } from 'src/utils/time/time';
import { getNodeName, getTarget, hasClass } from 'src/utils/dom/dom';

import { curry2, equal } from 'src/utils/function/curry';
import { pipe } from 'src/utils/function/pipe';
import { CallWithoutArguments, call } from 'src/utils/function/utils';
import { noop } from 'src/utils/function/noop';
import { ClickInfo } from './type';
import {
    CLICKMAP_PROVIDER,
    CLICKMAP_RESOURCE,
    DELTA_SAME_CLICKS,
    GLOBAL_STORAGE_CLICKS_KEY,
    TClickMapParams,
    TIMEOUT_CLICK,
    TIMEOUT_SAME_CLICKS,
} from './const';

const isIgnoredElement = curry2(hasClass)(
    '(ym-disable-clickmap|ym-clickmap-ignore)',
);

export const isCurrentClickTracked = (
    ctx: Window,
    click: ClickInfo,
    lastClick: ClickInfo,
    ignoreTags: string[],
    filter: AnyFunc | undefined,
): boolean => {
    if (has(ctx, 'ymDisabledClickmap') || !click || !click.element) {
        return false;
    }

    const nodeName = getNodeName(click.element);

    // eslint-disable-next-line ban/ban
    if (filter && !filter(click.element, nodeName)) {
        return false;
    }

    if (includes(click.button, [2, 3]) && nodeName !== 'A') {
        return false;
    }

    // Пользовательский фильтр на теги
    if (cSome(equal(nodeName), ignoreTags)) {
        return false;
    }

    // Не отправляем клик, если у элемента или у родителя есть класс ym-disable-clickmap
    // Класс ym-clickmap-ignore оставлен для совместимости

    let currentElement: HTMLElement | null = click.element;
    if (click && lastClick) {
        // Отправляем клики не чаще TIMEOUT_CLICK
        if (click.time - lastClick.time < TIMEOUT_CLICK) {
            return false;
        }

        // Близкие клики отправляем не чаще TIMEOUT_SAME_CLICKS
        const deltaX = Math.abs(lastClick.position.x - click.position.x);
        const deltaY = Math.abs(lastClick.position.y - click.position.y);
        const deltaTime = click.time - lastClick.time;

        if (
            lastClick.element === currentElement &&
            deltaX < DELTA_SAME_CLICKS &&
            deltaY < DELTA_SAME_CLICKS &&
            deltaTime < TIMEOUT_SAME_CLICKS
        ) {
            return false;
        }
    }

    while (currentElement) {
        if (isIgnoredElement(currentElement)) {
            return false;
        }
        currentElement = currentElement.parentElement;
    }

    return true;
};

const sendClick = (
    ctx: Window,
    url: string,
    pointerClick: string,
    sender: GetSenderType<typeof CLICKMAP_PROVIDER>,
    counterOptions: CounterOptions,
) => {
    const resource = flags.SENDER_COLLECT_FEATURE
        ? CLICKMAP_RESOURCE
        : `${CLICKMAP_RESOURCE}/${counterOptions.id}`;
    const measurementProtocolParams = {
        [CLICKMAP_URL_PARAM]: url,
        [HIT_TYPE_KEY]: HIT_TYPE_EVENT,
        [EVENT_ACTION_KEY]: HIT_TYPE_POINTER_CLICK,
        [EVENT_LABEL_KEY]: pointerClick,
        [COUNTER_ID_PARAM]: `${counterOptions.id}`,
    };
    const watchApiParams = {
        [CLICKMAP_URL_PARAM]: url,
        [CLICKMAP_POINTER_PARAM]: pointerClick,
    };
    const urlParams: UrlParams = flags.SENDER_COLLECT_FEATURE
        ? measurementProtocolParams
        : watchApiParams;
    const senderInfo: SenderInfo = {
        brInfo: browserInfo(),
        urlParams,
        urlInfo: { resource },
    };

    sender(senderInfo, counterOptions).catch(errorLogger(ctx, 'c.s.c'));
};

export const useClickMapProviderBase = (
    ctx: Window,
    counterOptions: CounterOptions,
) => {
    if (isBrokenFromCharCode(ctx)) {
        return noop;
    }
    const sender = getSender(ctx, CLICKMAP_PROVIDER, counterOptions);
    const counterKey = getCounterKey(counterOptions);

    const timer = TimeOne(ctx);
    const startTime = timer(getMs);
    const clickMapParamsGetter = bindArg(
        bindArg(counterKey, counterStateGetter(ctx)),
        pipe(call as CallWithoutArguments, ctxPath(COUNTER_STATE_CLICKMAP)),
    ) as () => TClickMapParams | null;

    let quota: number | null | undefined;
    let lastClick: ClickInfo = null;

    const handleMouseClickEvent = errorLogger(
        ctx,
        'clm.p.c',
        (event: MouseEvent) => {
            const rawClickMapParams = clickMapParamsGetter();
            if (!rawClickMapParams) {
                return;
            }

            if (flags.TELEMETRY_FEATURE) {
                const globalStorage = getGlobalStorage(ctx);
                const { clicks, x, y } = globalStorage.getVal(
                    GLOBAL_STORAGE_CLICKS_KEY,
                    { clicks: 0, x: 0, y: 0 },
                );
                globalStorage.setVal(GLOBAL_STORAGE_CLICKS_KEY, {
                    clicks: clicks + 1,
                    x: x + event.clientX,
                    y: y + event.clientY,
                });
            }

            const params =
                typeof rawClickMapParams === 'object' ? rawClickMapParams : {};
            // eslint-disable-next-line no-restricted-properties
            const { filter } = params;
            const isTrackHash = params['isTrackHash'] || false;
            const ignoreTags = cMap(
                (tag) => `${tag}`.toUpperCase(),
                params['ignoreTags'] || [],
            );
            if (isUndefined(quota)) {
                quota = params['quota'] || null;
            }
            const hasQuota = !!params['quota'];

            const currentClick: ClickInfo = {
                element: getTarget(ctx, event),
                position: getPosition(ctx, event),
                button: getMouseButton(event),
                time: timer(getMs),
            };

            const { href } = getLocation(ctx);
            if (
                isCurrentClickTracked(
                    ctx,
                    currentClick,
                    lastClick,
                    ignoreTags,
                    filter,
                )
            ) {
                if (hasQuota) {
                    if (!quota) {
                        return;
                    }
                    quota -= 1;
                }

                const [eWidth, eHeight] = getElementSize(
                    ctx,
                    currentClick.element as HTMLElement,
                );
                const elementPosition = getElementXY(ctx, currentClick.element);
                const MAX_VALUE = 65535;

                const pointerClickParamsArr = [
                    'rn',
                    getRandom(ctx),
                    'x',
                    Math.floor(
                        ((currentClick.position.x - elementPosition.left) *
                            MAX_VALUE) /
                            (eWidth || 1),
                    ),
                    'y',
                    Math.floor(
                        ((currentClick.position.y - elementPosition.top) *
                            MAX_VALUE) /
                            (eHeight || 1),
                    ),
                    't',
                    Math.floor((currentClick.time - startTime) / 100),
                    'p',
                    getElementPath(ctx, currentClick.element),
                    'X',
                    currentClick.position.x,
                    'Y',
                    currentClick.position.y,
                ];
                let pointerClickParams = arrayJoin(':', pointerClickParamsArr);

                if (isTrackHash) {
                    pointerClickParams = `${pointerClickParams}:wh:1`;
                }

                sendClick(
                    ctx,
                    href,
                    pointerClickParams,
                    sender,
                    counterOptions,
                );
                lastClick = currentClick;
            }
        },
    );

    return cEvent(ctx).on(
        getPath(ctx, 'document')!,
        ['click'],
        handleMouseClickEvent,
    );
};

/**
 * Provider for building heat map of clicks
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 */
export const useClickmapProvider = ctxErrorLogger(
    'clm.p',
    useClickMapProviderBase,
);
