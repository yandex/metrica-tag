import { getPath } from 'src/utils/object';
import {
    includes,
    isArray,
    cMap,
    toArray,
    flatMap,
    cFilter,
    arrayJoin,
    cForEach,
} from 'src/utils/array';
import { trimText } from 'src/utils/string/remove';
import { pipe, bindThisForMethod, bindArg, memo } from 'src/utils/function';
import { TAGS } from 'src/providers/clickmap/const';
import {
    getBody,
    getBoundingClientRect,
    getDocumentScroll,
    getDocumentSize,
    getElemCreateFunction,
    getElemCreateNSFunction,
    getNodeName,
    hasClass,
} from './dom';
import { isRemovedFromDoc } from './isRemovedFromDoc';
import { arrayFrom } from '../array/arrayFrom';
import { select } from './select';
/* eslint-disable */

export const getElementXY = (ctx: Window, el: HTMLElement | null) => {
    let element = el;
    const doc = getPath(ctx, 'document')!;
    const nodeName = getNodeName(element);
    if (
        !element ||
        !element.ownerDocument ||
        nodeName === 'PARAM' ||
        element === getBody(ctx) ||
        element === doc.documentElement
    ) {
        return {
            left: 0,
            top: 0,
        };
    }

    const box = getBoundingClientRect(element);
    if (box) {
        const documentScroll = getDocumentScroll(ctx);
        return {
            left: Math.round(box.left + documentScroll.x),
            top: Math.round(box.top + documentScroll.y),
        };
    }
    let left = 0;
    let top = 0;
    while (element) {
        left += element.offsetLeft;
        top += element.offsetTop;
        element = element.offsetParent as HTMLElement;
    }

    return {
        left,
        top,
    };
};

export const getElementSize = (ctx: Window, element: HTMLElement) => {
    const doc = getPath(ctx, 'document')!;
    if (element === getBody(ctx) || element === doc.documentElement) {
        return getDocumentSize(ctx);
    }

    const rect = getBoundingClientRect(element);
    return rect
        ? [rect.width, rect.height]
        : [element.offsetWidth, element.offsetHeight];
};

/**
 * @param ctx window element
 * @param el element to process
 *
 * @returns Position and size of an element.
 */
export const getElementRegion = (
    ctx: Window,
    el: HTMLElement,
): [left: number, top: number, width: number, height: number] => {
    const { left, top } = getElementXY(ctx, el);
    const [width, height] = getElementSize(ctx, el);

    return [left, top, width, height];
};

export const getElementParent = (ctx: Window, element: Node) => {
    const doc = getPath(ctx, 'document')!;
    if (!element || element === doc.documentElement) return null;

    if (element === getBody(ctx)) return doc.documentElement;

    // Blocked a frame with origin "http://alipromo.com" from accessing a cross-origin frame.
    // probably can change to parentElement
    const parent = getPath(element, 'parentNode') as HTMLElement;
    return parent;
};

export const getElementNeighborPosition = (
    ctx: Window,
    element: Node,
    ignored?: HTMLElement,
) => {
    const parent = getElementParent(ctx, element);

    if (parent) {
        const children = parent.childNodes;
        const elementNodeName = element && element.nodeName;
        let n = 0;

        for (let i = 0; i < children.length; i += 1) {
            const childNodeName = children[i] && children[i].nodeName;
            if (elementNodeName === childNodeName) {
                if (element === children[i]) {
                    return n;
                }
                if (!ignored || children[i] !== ignored) {
                    n += 1;
                }
            }
        }
    }
    return 0;
};

export const getCachedTags = memo(() => {
    let charCode = ';'.charCodeAt(0);
    const cacheTags: Record<string, string> = {};

    for (let i = 0; i < TAGS.length; i += 1) {
        cacheTags[TAGS[i]] = String.fromCharCode(charCode);
        charCode += 1;
    }

    return cacheTags;
});

export const getElementCSSSelector = (ctx: Window, el: HTMLElement | null) => {
    let selector = '';
    let element = el;
    const body = getBody(ctx)!;
    let elementSelector: string[] = [];
    const getFullSelector = () => {
        const lastComponentSelector = arrayJoin('', elementSelector);
        return selector
            ? `${lastComponentSelector} ${selector}`
            : lastComponentSelector;
    };
    const getUniqueSelector = () => {
        const fullSelector = getFullSelector();
        const selectedNodes = select(fullSelector, body);
        if (selectedNodes.length === 1) {
            return fullSelector;
        }
        return null;
    };

    while (element && element.parentElement) {
        if (element.id) {
            elementSelector.push(`#${element.id}`);
            const uniqueSelector = getUniqueSelector();
            if (uniqueSelector) {
                return uniqueSelector;
            }
        }
        if (element.classList.length) {
            cForEach(
                (className) => elementSelector.push(`.${className}`),
                arrayFrom(element.classList),
            );
            const uniqueSelector = getUniqueSelector();
            if (uniqueSelector) {
                return uniqueSelector;
            }
        }

        if (elementSelector.length) {
            selector = getFullSelector();
        }
        elementSelector = [];
        element = element.parentElement;
    }

    return null;
};

export const getElementPath = (
    ctx: Window,
    el: HTMLElement | null,
    ignored?: HTMLElement,
) => {
    let path = '';
    let element = el;
    const MAX_LEN_PATH = 128;
    const cacheTags = getCachedTags();
    let nodeName = getNodeName(element) || '*';

    while (
        element &&
        element.parentNode &&
        !includes(nodeName, ['BODY', 'HTML'])
    ) {
        path += cacheTags[nodeName] || '*';
        path += getElementNeighborPosition(ctx, element, ignored) || '';
        element = element.parentElement;
        nodeName = getNodeName(element) || '*';
    }

    return trimText(path, MAX_LEN_PATH);
};

export const getElementPathCached = (
    ctx: Window,
    el: HTMLElement | null,
    ignored?: HTMLElement,
) => {
    // this is needed to get data from element that was selected and then removed from DOM
    if (el && isRemovedFromDoc(ctx, el) && el['_ymp']) {
        return el['_ymp'];
    }
    const path = getElementPath(ctx, el, ignored);
    if (el) {
        el['_ymp'] = path;
    }
    return path;
};

export const getElementsByClassName = (
    classNames: string | string[],
    node: HTMLElement,
) => {
    const classes = isArray(classNames) ? classNames : [classNames];

    // eslint-disable-next-line no-param-reassign
    node = node || document;

    if (node.querySelectorAll) {
        const sel = arrayJoin(
            ', ',
            cMap((cls) => `.${cls}`, classes),
        );
        return toArray(node.querySelectorAll(sel));
    }

    // @ts-expect-error
    if (node.getElementsByClassName) {
        return flatMap(
            pipe(bindThisForMethod('getElementsByClassName', node), toArray),
            classes,
        );
    }

    const nodes = node.getElementsByTagName('*');
    const someClassRegexp = `(${arrayJoin('|', classes)})`;
    return cFilter(bindArg(someClassRegexp, hasClass), toArray(nodes));
};

/**
 * @param ctx
 * @param el
 * @param nodeName An optional name of a node used for filtering the result
 *
 * @returns An array of element children except hidden form elements
 */
export const getElementChildren = (
    ctx: Window,
    el?: HTMLElement | null,
    nodeName?: string,
): ChildNode[] => {
    const result = [];

    if (el) {
        const children = el.childNodes;
        if (children && children.length) {
            for (let i = 0; i < children.length; i += 1) {
                const child = children[i];
                if (child) {
                    const isHiddenInput =
                        child.nodeName === 'INPUT' &&
                        // @ts-expect-error
                        child.type &&
                        // @ts-expect-error
                        child.type.toLocaleLowerCase() === 'hidden';
                    if (
                        !isHiddenInput &&
                        (!nodeName || child.nodeName === nodeName)
                    ) {
                        result.push(child);
                    }
                }
            }
        }
    }
    return result;
};

export const makeElement = <T extends HTMLElement = HTMLElement>(
    ctx: Window,
    tag: string,
    parent?: HTMLElement,
    className?: string,
    attrs?: [string, string | number][],
    namespace?: string,
) => {
    const createElement = namespace
        ? bindArg(namespace, getElemCreateNSFunction(ctx))
        : getElemCreateFunction(ctx)!;
    const element = createElement(tag);
    if (className) {
        element.setAttribute('class', className);
    }

    if (attrs) {
        cForEach(([name, value]) => {
            element.setAttribute(name, value);
        }, attrs);
    }

    if (parent) {
        parent.appendChild(element);
    }

    return element as T;
};
