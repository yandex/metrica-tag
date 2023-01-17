import { flags } from '@inject';
import { DEBUG_EVENTS_FEATURE } from 'generated/features';
import { getCounterInstance } from 'src/utils/counter';
import { CounterOptions, getCounterKey } from 'src/utils/counterOptions';
import { bindArgs, callFirstArgument } from 'src/utils/function';
import { DataLayerObserverObject } from 'src/utils/dataLayerObserver';
import {
    waitForDataLayer,
    ECOMMERCE_SETTINGS_SOURCE_FLAG,
} from 'src/utils/ecommerce';
import { cForEach } from 'src/utils/array';
import { getPath } from 'src/utils/object';
import { ctxErrorLogger, errorLogger } from 'src/utils/errorLogger';
import { METHOD_NAME_PARAMS } from 'src/providers/params/const';
import { getCounterSettings } from 'src/utils/counterSettings';
import { getGlobalStorage } from 'src/storage/global';
import { dispatchDebuggerEvent } from 'src/providers/debugEvents';
import {
    handleTagManagerEcommerce,
    handleEcommerce,
} from './handleTagManagerEcommerce';
import { handleGtagEcommerce } from './handleGtagEcommerce';

const handleEvent = (
    ctx: Window,
    counterKey: string,
    sendParams: undefined | ((params: any) => void),
    event: unknown,
) => {
    if (!sendParams) {
        return;
    }

    const result =
        handleTagManagerEcommerce(event) ||
        handleGtagEcommerce(ctx, event) ||
        handleEcommerce(event);
    if (!result) {
        return;
    }

    if (flags[DEBUG_EVENTS_FEATURE]) {
        dispatchDebuggerEvent(ctx, {
            counterKey,
            name: 'ecommerce',
            data: result,
        });
    }

    sendParams({
        ['__ym']: {
            ['ecommerce']: [result],
        },
    });
};

const observeEcommerce = (
    ctx: Window,
    dataLayerPath: string,
    eventHandler: (event: unknown) => void,
) => {
    let observerObject: DataLayerObserverObject<string, void>;
    const onObserverStart = (
        observer: DataLayerObserverObject<string, void>,
    ) => {
        observerObject = observer;
        observer.observer.on(eventHandler);
    };
    const stopObserver = () => {
        if (observerObject) {
            observerObject.unsubscribe();
        }
    };

    const unsubscribeMethods = [
        waitForDataLayer(ctx, dataLayerPath, onObserverStart),
        stopObserver,
    ];
    return bindArgs([callFirstArgument, unsubscribeMethods], cForEach);
};

export const ecommerce = ctxErrorLogger(
    'p.e',
    (ctx: Window, counterOptions: CounterOptions) => {
        const counter = getCounterInstance(ctx, counterOptions);
        if (!counter) {
            return undefined;
        }
        const globalStorage = getGlobalStorage(ctx);
        const sendParams = counter[METHOD_NAME_PARAMS];
        const handle: (event: unknown) => void = errorLogger(
            ctx,
            'h.ee',
            bindArgs(
                [ctx, getCounterKey(counterOptions), sendParams],
                handleEvent,
            ),
        );

        if (counterOptions.ecommerce) {
            globalStorage.setVal(ECOMMERCE_SETTINGS_SOURCE_FLAG, 0);
            return observeEcommerce(ctx, counterOptions.ecommerce, handle);
        }

        const unsubscribePromise = getCounterSettings(
            counterOptions,
            (settings) => {
                const dataLayer: string = getPath(
                    settings,
                    'settings.ecommerce',
                );
                if (!dataLayer) {
                    return undefined;
                }

                globalStorage.setVal(ECOMMERCE_SETTINGS_SOURCE_FLAG, 1);
                return observeEcommerce(ctx, dataLayer, handle);
            },
        );

        return unsubscribePromise;
    },
);
