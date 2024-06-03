import { cForEach } from 'src/utils/array';
import { mix, getPath } from 'src/utils/object';
import { memo, bind, noop, curry2 } from 'src/utils/function';

import { setEvent } from './setEvent';
import type { EventOptions, EventElement, EventSetter } from './types';

export const checkSupportsPassive = memo((ctx: Window) => {
    let opt: EventOptions;
    let out = false;
    if (!ctx.addEventListener) {
        return out;
    }
    try {
        opt = Object.defineProperty({}, 'passive', {
            get() {
                out = true;
                return 1;
            },
        });
        ctx.addEventListener('test', noop, opt!);
    } catch (e) {
        // empty
    }
    return out;
});

export const opts = curry2(
    (
        isSupportsPassive: boolean,
        opt: EventOptions | undefined,
    ): EventOptions | undefined => {
        if (opt === null) {
            return undefined;
        }
        if (!isSupportsPassive) {
            return !!opt;
        }
        return mix(
            {
                capture: true,
                passive: true,
            },
            opt || {},
        );
    },
);

export const cEvent = memo((ctx: Window) => {
    const isSupportsPassive = checkSupportsPassive(ctx);
    const getOpt = opts(isSupportsPassive);
    const self = {} as EventSetter;
    return mix(self, {
        on<
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
            elem: E,
            names: T[] | readonly T[],
            fn: (this: E, ev: M[T]) => unknown,
            options?: EventOptions,
        ) {
            cForEach((name: T) => {
                const opt = getOpt(options);
                setEvent(ctx, elem, name, fn, opt, false);
            }, names);

            return bind(self.un, self, elem, names, fn, options);
        },
        un<
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
            elem: E,
            names: T[] | readonly T[],
            fn: (this: E, ev: M[T]) => unknown,
            options?: EventOptions,
        ) {
            cForEach((name: T) => {
                const opt = getOpt(options);
                setEvent(ctx, elem, name, fn, opt, true);
            }, names);
        },
    });
});

export const hasPageTransitionEvents = (ctx: Window) => 'onpagehide' in ctx;
export const hasPageVisibilityEvents = (ctx: Window) =>
    'hidden' in (getPath(ctx, 'document') || {});

export const hasModernUnloadEvents = (ctx: Window) =>
    hasPageTransitionEvents(ctx) || hasPageVisibilityEvents(ctx);
