import { UNSUBSCRIBE_PROPERTY } from 'src/providers/index';
import type { CounterObject } from 'src/utils/counter/type';
import type { CounterOptions } from 'src/utils/counterOptions';
import type { AnyFunc } from 'src/utils/function/types';
import { yaNamespace } from './const';

export type MetrikaCounterConstructor = (
    this: CounterObject,
    counterId: number,
    counterParams?: Record<string, unknown>,
    counterType?: number,
    counterDefer?: boolean,
) => void;

// eslint-disable-next-line
export interface MetrikaCounter extends MetrikaCounterConstructor {}

export type CounterMethod = keyof CounterObject;
export type ProviderResultObject = Record<string, AnyFunc> & {
    [UNSUBSCRIBE_PROPERTY]?: () => void;
};
export type ProviderResult =
    | ProviderResultObject
    | (() => void | null | undefined)
    | void
    | null
    | undefined;
export type ProviderResultPromised = Promise<ProviderResult>;
export type ProviderFunction =
    | ((ctx: Window) => ProviderResult | ProviderResultPromised)
    | ((
          ctx: Window,
          counterOptions: CounterOptions,
      ) => ProviderResult | ProviderResultPromised);
export type WindowProviderInitializer = (ctx: Window) => void;
export type StaticMethodInitializer = (
    ctx: Window,
    constructor: MetrikaCounter,
) => void;

export type Constructor = string;

declare global {
    interface CompressionStream {
        prototype: GenericTransformStream;
        new (format: 'gzip' | 'deflate'): GenericTransformStream;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface yaNamespaceStorage {}

    type yaNamespaceMetrikaCounter = {
        [construct in Constructor]: MetrikaCounter;
    };

    interface Window {
        [yaNamespace]?: yaNamespaceStorage & yaNamespaceMetrikaCounter;
        XMLHttpRequest: typeof XMLHttpRequest;
        Error: typeof Error;
        Promise: typeof Promise;
        Object: typeof Object;
        Array: typeof Array;
        Uint8Array: typeof Uint8Array;
        Float32Array: typeof Float32Array;
        Element: typeof Element;
        Function: typeof Function;
        JSON: typeof JSON;
        Blob: typeof Blob;
        TextEncoder: typeof TextEncoder;
        FileReader: typeof FileReader;
        Date: typeof Date;
        Math: typeof Math;
        Event: typeof Event;
        isNaN: typeof Number.isNaN;
        isFinite: typeof Number.isFinite;
        NodeFilter: typeof NodeFilter;
        MutationObserver: typeof MutationObserver;
        Proxy: typeof Proxy;
        CompressionStream: typeof CompressionStream;
        opera?: {
            version?: () => string;
        };
        fetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
        webdriver?: boolean;
        RTCPeerConnection?: () => void;
        isWebKit?: () => boolean;
        PerformanceObserver?: typeof PerformanceObserver;
        HTMLImageElement: typeof HTMLImageElement;
        HTMLInputElement: typeof HTMLInputElement;
        MouseEvent: typeof MouseEvent;
        WebSocket: typeof WebSocket;
        Notification?: typeof Notification;
        AbortController?: typeof AbortController;
        chrome: {
            runtime: {
                getURL: (url: string) => string;
            };
            loadTimes(): { firstPaintTime: number };
        };
        XPathResult: typeof XPathResult;
    }

    interface Document {
        addEventListener(
            type: string,
            listener: EventListenerOrEventListenerObject,
            options?: boolean | AddEventListenerOptions,
        ): void;
    }

    interface DocumentAndElementEventHandlers {
        attachEvent?: (type: string, listener: () => void) => boolean;
    }

    interface Element {
        getElementsByClassName(classNames: string): HTMLCollectionOf<Element>;
        nonce?: string;
        mozMatchesSelector?: (selectors: string) => boolean;
        msMatchesSelector?: (selectors: string) => boolean;
        oMatchesSelector?: (selectors: string) => boolean;
    }

    interface Brand {
        brand: string;
        version: string;
    }

    interface HintsData {
        architecture: string;
        bitness: string;
        brands: Brand[];
        fullVersionList: Brand[];
        mobile: boolean;
        model: string;
        platform: string;
        platformVersion: string;
        uaFullVersion: string;
    }

    interface Navigator {
        userAgentData?: {
            getHighEntropyValues: (hints: string[]) => Promise<HintsData>;
        };
    }

    // Define global.window within NodeJS (e.g. for tests).
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        interface Global {
            window: Window;
        }
    }
}
