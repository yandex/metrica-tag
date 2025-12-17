declare global {
    interface Window {
        attachEvent?<M extends WindowEventMap>(
            event: `on${keyof M}`,
            cb: (this: Window, ev: M[keyof M]) => unknown,
        ): void;
        detachEvent?<M extends WindowEventMap>(
            event: `on${keyof M}`,
            cb: (this: Window, ev: M[keyof M]) => unknown,
        ): void;
    }

    interface Document {
        attachEvent?<M extends DocumentEventMap>(
            event: `on${keyof M}`,
            cb: (this: Window, ev: M[keyof M]) => unknown,
        ): void;
        detachEvent?<M extends DocumentEventMap>(
            event: `on${keyof M}`,
            cb: (this: Window, ev: M[keyof M]) => unknown,
        ): void;
    }

    interface HTMLElement {
        attachEvent?<M extends HTMLElementEventMap>(
            event: `on${keyof M}`,
            cb: (this: Window, ev: M[keyof M]) => unknown,
        ): void;
        detachEvent?<M extends DocumentEventMap>(
            event: `on${keyof M}`,
            cb: (this: Window, ev: M[keyof M]) => unknown,
        ): void;
    }

    interface VisualViewport {
        attachEvent?<M extends VisualViewportEventMap>(
            event: `on${keyof M}`,
            cb: (this: Window, ev: M[keyof M]) => unknown,
        ): void;
        detachEvent?<M extends DocumentEventMap>(
            event: `on${keyof M}`,
            cb: (this: Window, ev: M[keyof M]) => unknown,
        ): void;
    }

    interface DocumentEventMap {
        DOMContentLoaded: Event;
    }
}

export type EventOptionsObject = {
    capture?: boolean;
    passive?: boolean;
};
export type EventOptions = EventOptionsObject | boolean | null;
export type EventElement = HTMLElement | Document | Window | VisualViewport;

export type EventSetter = {
    /** Attach event handlers */
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
    ): () => void;
    on<
        E extends Window | Document,
        M extends WindowEventMap & DocumentEventMap,
        T extends keyof M,
    >(
        elem: E,
        names: T[] | readonly T[],
        fn: (this: E, ev: M[T]) => unknown,
        options?: EventOptions,
    ): () => void;
    on<
        E extends Window | Document | HTMLElement,
        M extends WindowEventMap & DocumentEventMap & HTMLElementEventMap,
        T extends keyof M,
    >(
        elem: E,
        names: T[] | readonly T[],
        fn: (this: E, ev: M[T]) => unknown,
        options?: EventOptions,
    ): () => void;

    /** Detach event handlers */
    un<
        E extends Window | Document | HTMLElement | VisualViewport,
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
        fn: (this: Window, ev: M[T]) => unknown,
        options?: EventOptions,
    ): void;
    un<
        E extends Window | Document,
        M extends WindowEventMap & DocumentEventMap,
        T extends keyof M,
    >(
        elem: E,
        names: T[] | readonly T[],
        fn: (this: E, ev: M[T]) => unknown,
        options?: EventOptions,
    ): void;
    un<
        E extends Window | Document | HTMLElement,
        M extends WindowEventMap & DocumentEventMap & HTMLElementEventMap,
        T extends keyof M,
    >(
        elem: E,
        names: T[] | readonly T[],
        fn: (this: E, ev: M[T]) => unknown,
        options?: EventOptions,
    ): void;
};
