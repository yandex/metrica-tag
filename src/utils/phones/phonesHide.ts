import { CounterOptions } from 'src/utils/counterOptions';
import {
    ANY_PHONE,
    PhoneTuple,
    ReplaceElement,
    ReplaceElementLink,
} from 'src/utils/phones/const';
import { getElemCreateFunction } from 'src/utils/dom';
import { cFilter, cForEach, cMap, cReduce, toArray } from 'src/utils/array';
import { getCounterInstance } from 'src/utils/counter';
import { METHOD_NAME_EXTERNAL_LINK_CLICK } from 'src/providers/clicks/const';
import {
    bind,
    bindArg,
    bindThisForMethod,
    call,
    ctxBindThisForMethod,
    firstArg,
    pipe,
} from 'src/utils/function';
import { createPhoneDomReplacer } from 'src/utils/phones/phonesDom';
import { cEvent, observer, throttleObserver } from 'src/utils/events';
import { removeSpaces, removeNonDigits } from 'src/utils/string/remove';
import { genPath } from 'src/utils/object';
import { clearDefer, setDefer } from 'src/utils/defer';
import { noop } from 'src/utils/function/noop';
import { phoneSubscribeLoad, phoneSubscribeMutation } from './phonesSubscribe';

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
        cForEach(
            bindArg(['style', 'opacity', ''], genPath),
            toArray(phoneWrapper.childNodes),
        );

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

            (unsubscribeLeave || noop)();
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
        replaceElementType === 'text' &&
        textContent &&
        createElement &&
        parentNode
    ) {
        const phoneWrapper = createElement(TAG);
        resetStyles(phoneWrapper);

        const chars = textContent.split('');
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
                        visibleCharsCount:
                            visibleCharsCount + (isVisible ? 1 : 0),
                    };
                },
                { nodes: [] as HTMLElement[], visibleCharsCount: 0 },
                chars,
            ).nodes,
        );

        setEnterHandler(ctx, counterOpts, phoneWrapper, replaceFrom);

        parentNode.insertBefore(phoneWrapper, replaceHTMLNode);
        replaceHTMLNode.textContent = '';
        return true;
    }

    return false;
};

export const hidePhones = (
    ctx: Window,
    counterOpt: CounterOptions | null,
    phones: string[],
) => {
    const domReplacer = createPhoneDomReplacer(ctx, counterOpt, {
        transformer: transformPhone,
        needReplaceTypes: {
            [ReplaceElementLink]: true,
        },
    });

    const cleanPhones = cFilter(
        Boolean,
        cMap(
            (phone) => (phone === ANY_PHONE ? phone : removeNonDigits(phone)),
            phones,
        ),
    );

    const formattedPhones = cMap(
        pipe(
            firstArg,
            bindThisForMethod('concat', ['']),
            ctxBindThisForMethod('reverse'),
            call,
        ),
        cleanPhones,
    ) as PhoneTuple[];

    const rawObserver = observer(ctx);
    const throttledObserver = throttleObserver(ctx, rawObserver, THROTTLE_TIME);
    const listener = bind(
        domReplacer.replacePhonesDom,
        domReplacer,
        formattedPhones,
    );
    throttledObserver.on(listener);

    phoneSubscribeLoad(ctx, rawObserver);
    phoneSubscribeMutation(ctx, rawObserver);

    listener();
};
