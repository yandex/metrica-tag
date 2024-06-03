import { memo } from '../function';
import { EventElement, EventOptions } from './types';

const addFunction = 'addEventListener';
const removeFunction = 'removeEventListener';
// for old browsers
const attachFunction = 'attachEvent';
const detachFunction = 'detachEvent';

const getEventSubscribeMethods = memo((ctx: Window) => {
    const supportsAdd = !!(ctx[addFunction] && ctx[removeFunction]);
    return {
        supportsAdd,
        on: supportsAdd ? addFunction : attachFunction,
        off: supportsAdd ? removeFunction : detachFunction,
    };
});

export const setEvent = <
    E extends EventElement,
    M extends E extends Window
        ? WindowEventMap
        : E extends Document
        ? DocumentEventMap
        : E extends HTMLElement
        ? HTMLElementEventMap
        : E extends VisualViewport
        ? VisualViewportEventMap
        : never,
    T extends keyof M,
>(
    ctx: Window,
    el: E,
    name: T,
    handler: (this: E, ev: M[T]) => any,
    opt?: EventOptions,
    detach?: boolean,
): void => {
    const anyEl = el as any;
    const { supportsAdd, on, off } = getEventSubscribeMethods(ctx);
    const fn = detach ? off : on;
    if (!anyEl[fn]) {
        return;
    }
    if (supportsAdd) {
        if (opt) {
            anyEl[fn](name, handler, opt);
        } else {
            anyEl[fn](name, handler);
        }
    } else {
        anyEl[fn](`on${name}`, handler);
    }
};
