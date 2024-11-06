import {
    pipe,
    bindArg,
    memo,
    equal,
    bindThisForMethodTest,
} from 'src/utils/function';
import { isNativeFunction } from 'src/utils/function/isNativeFunction/isNativeFunction';
import { getNativeFunction } from 'src/utils/function/isNativeFunction/getNativeFunction';
import { ctxPath, isNil, getPath, isFunction } from 'src/utils/object';
import { toArray, cIndexOf, cFind, cSome } from 'src/utils/array';
import { isString, convertToString } from 'src/utils/string';
import { isIE } from 'src/utils/browser';

export const isTextNode = (node?: Node) => {
    if (isNil(node)) {
        return false;
    }
    const { nodeType } = node;

    // textNode или comment
    return nodeType === 3 || nodeType === 8;
};

export const getInnerText = (node?: HTMLElement | null) => {
    return node ? node.innerText || '' : '';
};

export const isDocumentFragment = (node?: Node | null) => {
    if (isNil(node)) {
        return false;
    }
    const { nodeType } = node;

    // DOCUMENT_FRAGMENT_NODE
    return nodeType === 11;
};

export const getDocumentElement: (ctx: Window) => HTMLElement = memo(
    ctxPath('document.documentElement'),
);

export const getDocumentEncoding = memo((ctx: Window) => {
    const doc = getPath(ctx, 'document')! || {};
    return `${doc.characterSet || doc.charset || ''}`.toLowerCase();
});

export const getElemCreateFunction = memo<
    (ctx: Window) => Document['createElement']
>(pipe(ctxPath('document'), bindArg('createElement', getNativeFunction)));

export const getElemCreateNSFunction = memo(
    pipe(ctxPath('document'), bindArg('createElementNS', getNativeFunction)),
);

export const removeNode = (node: Node) => {
    const parentNode = node && node.parentNode;
    if (parentNode) {
        parentNode.removeChild(node);
    }
};

export const preventDefault = (event: Event) => {
    const eventObject = event || window.event;

    if (eventObject.preventDefault) {
        eventObject.preventDefault();
    } else {
        eventObject.returnValue = false;
    }
};

export const getTarget = (event: Event): Element | null => {
    type documentAliases = 'ownerDocument' | 'documentElement';
    type ExtendedTarget =
        | (EventTarget & { [d in documentAliases]: Document })
        | null;
    let target;

    // Permission denied to access property "target"
    // Unable to get property 'ownerDocument' of undefined or null reference
    try {
        target = (event.target || event.srcElement) as ExtendedTarget;

        if (target) {
            if (!target.ownerDocument && target.documentElement) {
                // Походу на document попали, берём html
                target = target.documentElement;
            } else if (target.ownerDocument !== document) {
                // Чужой iframe
                target = null;
            }
        }
    } catch (_) {
        /* empty */
    }

    return target as unknown as Element;
};

export const getTagName = (tag: { nodeName: string }) => {
    return tag && tag.nodeName && `${tag.nodeName}`.toLowerCase();
};

export const hasClass = (className: string, el: HTMLElement) => {
    try {
        return new RegExp(`(?:^|\\s)${className}(?:\\s|$)`).test(el.className);
    } catch (e) {
        return false;
    }
};

export const getMatchesFunction = memo((ctx: Window) => {
    const elementPrototype = getPath(ctx, 'Element.prototype');
    if (!elementPrototype) {
        return null;
    }
    const matchFunctionName = cFind(
        (fnName) => {
            const fn = elementPrototype[fnName];
            return !!fn && isNativeFunction(fnName, fn);
        },
        [
            'matches',
            'webkitMatchesSelector',
            'mozMatchesSelector',
            'msMatchesSelector',
            'oMatchesSelector',
        ] as const,
    );

    if (matchFunctionName) {
        return elementPrototype[
            matchFunctionName
        ] as typeof ctx.Element.prototype.matches;
    }

    return null;
});

export const getBody = (ctx: Window): HTMLBodyElement | null => {
    const doc: Document = getPath(ctx, 'document')!;
    try {
        const bodies = doc.getElementsByTagName('body');
        return bodies[0];
    } catch (e) {
        return null;
    }
};

export const getRootElement = (ctx: Window) => {
    const doc: Document = getPath(ctx, 'document')! || {};
    const docElement: HTMLElement | undefined = doc.documentElement;

    // В некоторых случаях document.body == null
    // возможно код счётчика вставлен в <head> или какие-то непонятные ошибки
    // чтобы не было js-ошибок возвращаем documentElement
    return doc.compatMode === 'CSS1Compat'
        ? docElement
        : getBody(ctx) || docElement;
};

export const getVisualViewportSize = (
    ctx: Window,
): [number, number, number] | null => {
    const width = getPath(ctx, 'visualViewport.width');
    const height = getPath(ctx, 'visualViewport.height');
    const scale = getPath(ctx, 'visualViewport.scale')!;

    if (!isNil(width) && !isNil(height)) {
        return [Math.floor(width), Math.floor(height), scale];
    }

    return null;
};

export const getViewportSize = (ctx: Window): [number, number] => {
    const visualViewport = getVisualViewportSize(ctx);
    if (visualViewport) {
        const [width, height, scale] = visualViewport;
        return [ctx.Math.round(width * scale), ctx.Math.round(height * scale)];
    }

    const root = getRootElement(ctx);
    return [
        // Нужно уметь работать без root
        getPath(root, 'clientWidth') || ctx.innerWidth,
        getPath(root, 'clientHeight') || ctx.innerHeight,
    ];
};

export const getDocumentScroll = (ctx: Window) => {
    const body = getBody(ctx);
    const doc = getPath(ctx, 'document')!;
    return {
        x:
            ctx.pageXOffset ||
            (doc.documentElement && doc.documentElement.scrollLeft) ||
            (body && body.scrollLeft) ||
            0,
        y:
            ctx.pageYOffset ||
            (doc.documentElement && doc.documentElement.scrollTop) ||
            (body && body.scrollTop) ||
            0,
    };
};

export const getPos = (ctx: Window, evt: MouseEvent): [number, number] => {
    const rootElement = getRootElement(ctx);
    const documentScroll = getDocumentScroll(ctx);

    return [
        evt.pageX ||
            evt.clientX + documentScroll.x - (rootElement.clientLeft || 0) ||
            0,
        evt.pageY ||
            evt.clientY + documentScroll.y - (rootElement.clientTop || 0) ||
            0,
    ];
};

export const getDocumentSize = (ctx: Window): [number, number] => {
    const root = getRootElement(ctx);
    const [vWidth, vHeight] = getViewportSize(ctx);
    return [
        Math.max(root.scrollWidth, vWidth),
        Math.max(root.scrollHeight, vHeight),
    ];
};

/**
 * In case of error we return a partial implementation,
 * thus it is safer to exclude properties that are not guaranteed.
 */
export type CustomDOMRect = Pick<
    DOMRect,
    'top' | 'bottom' | 'left' | 'width' | 'height' | 'right'
>;

// https://github.com/linkedin/spaniel/issues/75
export const getBoundingClientRect = (
    element: Element,
): CustomDOMRect | null => {
    try {
        return element.getBoundingClientRect && element.getBoundingClientRect();
    } catch (error) {
        if (
            typeof error === 'object' &&
            error !== null &&
            // eslint-disable-next-line no-bitwise
            (error.number && error.number & 0xffff) === 16389
        ) {
            return {
                top: 0,
                bottom: 0,
                left: 0,
                width: 0,
                height: 0,
                right: 0,
            };
        }

        return null;
    }
};

export const createAndDispatchEvent = (
    ctx: Window,
    eventName: string,
    target?: HTMLElement,
) => {
    const eventTarget = target || ctx.document;
    const dispatchEvent = getNativeFunction('dispatchEvent', eventTarget);
    let event: Event | null = null;
    const eventConstructor = getPath(ctx, 'Event.prototype.constructor');
    const isEventConstructorNative =
        eventConstructor &&
        (isNativeFunction('(Event|Object|constructor)', eventConstructor) ||
            (isIE(ctx) &&
                convertToString(eventConstructor) === '[object Event]'));
    if (isEventConstructorNative) {
        // opera 10 bug 'NOT_SUPPORTED_ERR'
        try {
            event = new ctx.Event(eventName);
        } catch (e) {
            const createEvent = getNativeFunction(
                'createEvent',
                getPath(ctx, 'document'),
            );
            if (createEvent && isFunction(createEvent)) {
                // opera 10 bug 'NOT_SUPPORTED_ERR'
                try {
                    event = createEvent(eventName);
                } catch (err) {
                    // empty
                }
                if (event && event.initEvent) {
                    event.initEvent(eventName, false, false);
                }
            }
        }
    }

    if (event) {
        dispatchEvent(event);
    }
};

export const getFormNumber = (ctx: Window, form: HTMLElement) => {
    const { document: doc } = ctx;
    const forms = doc.getElementsByTagName('form');
    return cIndexOf(ctx)(form, toArray(forms));
};
/* Тяжело и медленно! 68324 bytes => 68380
export const getNodeName = pipe(
    bindArg,
    cont(getPath),
    ctxMapSwap(['nodeName', 'tagName']),
    bindArg(firstArg as any, cFind),
);
*/
export const getNodeName = (node: HTMLElement | Element | null) => {
    if (node) {
        try {
            // Чтобы не звать лишний раз нативный геттер который
            let name = node.nodeName;
            // METR-41427
            if (isString(name)) {
                return name;
            }
            name = node.tagName;
            if (isString(name)) {
                return name;
            }
        } catch (e) {}
    }
    return undefined;
};

type IsInputElementFn = (
    element: HTMLElement | Element,
) => element is HTMLInputElement;
const equalInput: (arg?: string) => boolean =
    equal<string | undefined>('INPUT');
export const isInputElement = pipe(getNodeName, equalInput) as IsInputElementFn;

type IsTextAreaElementFn = (
    element: HTMLElement | Element,
) => element is HTMLTextAreaElement;
const equalTextarea: (arg?: string) => boolean =
    equal<string | undefined>('TEXTAREA');
export const isTextAreaElement = pipe(
    getNodeName,
    equalTextarea,
) as IsTextAreaElementFn;

type IsSelectElementFn = (
    element: HTMLElement | Element,
) => element is HTMLSelectElement;
const equalSelect: (arg?: string) => boolean =
    equal<string | undefined>('SELECT');
export const isSelectElement = pipe(
    getNodeName,
    equalSelect,
) as IsSelectElementFn;

const isCheckableRegex = /^(checkbox|radio)$/;
export const isCheckable = pipe(
    ctxPath('type'),
    bindThisForMethodTest(isCheckableRegex),
);

const isCommonInputRegex = /^INPUT|SELECT|TEXTAREA$/;
export const isCommonInput = pipe(
    getNodeName,
    bindThisForMethodTest(isCommonInputRegex),
);

const isCommonInputOrButtonRegex = /^INPUT|SELECT|TEXTAREA|BUTTON$/;
export const isCommonInputOrButton = pipe(
    getNodeName,
    bindThisForMethodTest(isCommonInputOrButtonRegex),
);

export const INPUT_NODES = [
    'INPUT',
    'CHECKBOX',
    'RADIO',
    'TEXTAREA',
    'SELECT',
    'PROGRESS',
];
// eslint-disable-next-line no-restricted-properties -- the join is evaluated at build time
export const IS_INPUT_REGEX = new RegExp(`^(${INPUT_NODES.join('|')})$`, 'i');
export const isInput = pipe(getNodeName, bindThisForMethodTest(IS_INPUT_REGEX));

const inputTypesWithoutValue = ['submit', 'image', 'hidden'];
export const isEmptyField = (field: HTMLElement | Element) => {
    if (
        isInputElement(field) &&
        !cSome(equal(field.type), inputTypesWithoutValue)
    ) {
        if (isCheckable(field)) {
            return !field.checked;
        }
        return !field.value;
    }

    if (isTextAreaElement(field)) {
        return !field.value;
    }

    if (isSelectElement(field)) {
        return field.selectedIndex < 0;
    }

    return true;
};

export const calculateVisibleVolume = (
    ctx: Window,
    clientRect: CustomDOMRect,
    viewportSize: { h: number; w: number },
) => {
    const { top, bottom, right, left } = clientRect;
    const { w, h } = viewportSize;
    const math = ctx.Math;

    const visibleWidth =
        math.min(math.max(right, 0), w) - math.min(math.max(left, 0), w);
    const visibleHeight =
        math.min(math.max(bottom, 0), h) - math.min(math.max(top, 0), h);

    return visibleHeight * visibleWidth;
};
