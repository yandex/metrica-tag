import { CounterOptions } from 'src/utils/counterOptions';
import {
    ANY_PHONE,
    PhoneTuple,
    ReplaceElement,
    ReplaceElementLink,
} from 'src/utils/phones/const';
import { getElemCreateFunction } from 'src/utils/dom/dom';
import { filterFalsy } from 'src/utils/array/filter';
import { toArray } from 'src/utils/array/utils';
import { cReduce } from 'src/utils/array/reduce';
import { cMap, cForEach } from 'src/utils/array/map';
import { getCounterInstance } from 'src/utils/counter/getInstance';
import { METHOD_NAME_EXTERNAL_LINK_CLICK } from 'src/providers/clicks/const';
import {
    bindArg,
    bindThisForMethod,
    ctxBindThisForMethod,
} from 'src/utils/function/bind';
import { createPhoneDomReplacer } from 'src/utils/phones/phonesDom';
import { cEvent } from 'src/utils/events/events';
import { removeSpaces, removeNonDigits } from 'src/utils/string/remove';
import { genPath, mix } from 'src/utils/object';
import { clearDefer, setDefer } from 'src/utils/defer/defer';
import { noop } from 'src/utils/function/noop';
import { call } from 'src/utils/function/utils';
import { pipe } from 'src/utils/function/pipe';
import { firstArg } from 'src/utils/function/identity';
import { phoneSubscribeLoad, phoneSubscribeMutation } from './phonesSubscribe';
import { observer } from '../events/observer';
import { throttleObserver } from '../events/throttleObserver';

const NON_SPACE_REGEXP = /\S/;
const TAG = 'small';
const RESET_STYLES =
    'display:inline;margin:0;padding:0;font-size:inherit;color:inherit;line-height:inherit';

export const THROTTLE_TIME = 1000;
export const HOVER_TIMEOUT = 200;

const setEnterHandler = (
    ctx: Window,
    counterOpts: CounterOptions | null,
    phoneWrapper: HTMLElement,
    from: string,
) => {
    const eventHandler = cEvent(ctx);
    let unsubscribeEnter: () => void = noop;
    let unsubscribeLeave: () => void = noop;

    const show = () => {
        cForEach((node) => {
            if (!node.style) {
                return;
            }
            mix(node.style, { opacity: '' });
        }, toArray<HTMLElement>(phoneWrapper.childNodes));

        if (counterOpts) {
            const counter = getCounterInstance(ctx, counterOpts);
            if (counter) {
                counter[METHOD_NAME_EXTERNAL_LINK_CLICK]!(`tel:${from}`, {});
            }
        }

        unsubscribeEnter();
        unsubscribeLeave();
    };

    const enterCb = (e: MouseEvent) => {
        if (e.target === phoneWrapper) {
            const deferId = setDefer(ctx, show, HOVER_TIMEOUT, 'ph.h.e');

            unsubscribeLeave();
            unsubscribeLeave = eventHandler.on(
                phoneWrapper,
                ['mouseleave'],
                (event: MouseEvent) => {
                    if (event.target === phoneWrapper) {
                        clearDefer(ctx, deferId);
                    }
                },
            );
        }
    };

    unsubscribeEnter = eventHandler.on(phoneWrapper, ['mouseenter'], enterCb);
};

const resetStyles = bindArg(['style', RESET_STYLES], genPath);

export const transformPhone = (
    ctx: Window,
    counterOpts: CounterOptions | null,
    item: ReplaceElement,
) => {
    const createElement = getElemCreateFunction(ctx);
    const { replaceElementType, replaceHTMLNode, replaceFrom } = item;
    const { parentNode, textContent } = replaceHTMLNode;
    if (
        !(
            replaceElementType === 'text' &&
            textContent &&
            createElement! &&
            parentNode
        )
    ) {
        return false;
    }

    const phoneWrapper = createElement(TAG);
    resetStyles(phoneWrapper);
    const nonSpaceCharsLength = removeSpaces(textContent).length;

    cForEach(
        bindThisForMethod('appendChild', phoneWrapper),
        cReduce(
            ({ nodes, visibleCharsCount }, char) => {
                const result = createElement(TAG);
                result.innerHTML = char;
                const isVisible = NON_SPACE_REGEXP.test(char);

                resetStyles(result);
                if (isVisible) {
                    result.style.opacity = `${
                        (nonSpaceCharsLength - visibleCharsCount - 1) /
                        nonSpaceCharsLength
                    }`;
                }

                nodes.push(result);
                return {
                    nodes,
                    visibleCharsCount: visibleCharsCount + (isVisible ? 1 : 0),
                };
            },
            { nodes: [] as HTMLElement[], visibleCharsCount: 0 },
            textContent,
        ).nodes,
    );

    setEnterHandler(ctx, counterOpts, phoneWrapper, replaceFrom);

    parentNode.insertBefore(phoneWrapper, replaceHTMLNode);
    replaceHTMLNode.textContent = '';
    return true;
};

export const hidePhones = (
    ctx: Window,
    counterOpt: CounterOptions | null,
    phones: string[],
) => {
    const replacePhonesDom = createPhoneDomReplacer(ctx, counterOpt, {
        transformer: transformPhone,
        needReplaceTypes: {
            [ReplaceElementLink]: true,
        },
    });

    const cleanPhones = filterFalsy(
        cMap(
            (phone) => (phone === ANY_PHONE ? phone : removeNonDigits(phone)),
            phones,
        ),
    );

    const formattedPhones = cMap<string, PhoneTuple>(
        pipe(
            firstArg,
            bindThisForMethod('concat', ['']),
            ctxBindThisForMethod('reverse') as () => PhoneTuple,
            call,
        ),
        cleanPhones,
    );

    const rawObserver = observer(ctx);
    const throttledObserver = throttleObserver(ctx, rawObserver, THROTTLE_TIME);
    const listener = bindArg(formattedPhones, replacePhonesDom);
    throttledObserver.on(listener);

    phoneSubscribeLoad(ctx, rawObserver);
    phoneSubscribeMutation(ctx, rawObserver);

    listener();
};
