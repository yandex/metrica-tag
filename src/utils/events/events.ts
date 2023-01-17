import { cForEach } from 'src/utils/array';
import { mix, getPath } from 'src/utils/object';
import { memo, bind, noop, curry2 } from 'src/utils/function';

import { setEvent } from './setEvent';
import { EventOptions, EventElement } from './types';

const checkSupportsPassive = memo((ctx: Window) => {
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
        ctx.addEventListener('test', noop, opt);
    } catch (e) {
        // empty
    }
    return out;
});

const opts = curry2(
    (
        isSupportsPassive: boolean,
        opt: EventOptions | undefined,
    ): EventOptions => {
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

export type EventSetter = {
    on: (
        elem: EventElement,
        names: string[],
        fn: Function,
        options?: EventOptions,
    ) => () => void;
    un: (
        elem: EventElement,
        names: string[],
        fn: Function,
        options?: EventOptions,
    ) => void;
};

const cEvent = memo((ctx: Window) => {
    const isSupportsPassive = checkSupportsPassive(ctx);
    const getOpt = opts(isSupportsPassive);
    const self = {} as EventSetter;
    return mix(self, {
        on(
            elem: EventElement,
            names: string[],
            fn: Function,
            options?: EventOptions,
        ) {
            cForEach((name: string) => {
                const opt = getOpt(options);
                setEvent(elem, name, fn, opt, false);
            }, names);

            return bind(self.un, self, elem, names, fn, options);
        },
        un(
            elem: EventElement,
            names: string[],
            fn: Function,
            options?: EventOptions,
        ) {
            cForEach((name: string) => {
                const opt = getOpt(options);
                setEvent(elem, name, fn, opt, true);
            }, names);
        },
    } as EventSetter);
});

const hasPageTransitionEvents = (ctx: Window) => 'onpagehide' in ctx;
const hasPageVisibilityEvents = (ctx: Window) =>
    'hidden' in (getPath(ctx, 'document') || {});

const hasModernUnloadEvents = (ctx: Window) =>
    hasPageTransitionEvents(ctx) || hasPageVisibilityEvents(ctx);

export {
    cEvent,
    checkSupportsPassive,
    opts,
    hasPageTransitionEvents,
    hasPageVisibilityEvents,
    hasModernUnloadEvents,
};
