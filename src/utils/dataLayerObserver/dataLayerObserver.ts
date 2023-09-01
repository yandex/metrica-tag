import { getGlobalStorage } from 'src/storage/global';
import { getPath, isFunction } from 'src/utils/object';
import { cForEach } from 'src/utils/array';
import { firstArg, noop, bindArg } from 'src/utils/function';
import { argsToArray } from 'src/utils/function/args';
import { emitter, Emitter, observer, Observer } from '../events';
import { MessageData } from '../iframeConnector/types';

export const INNER_DATA_LAYER_KEY = 'dataLayer';
export const INNER_DATA_LAYER_NAMESPACE = 'ymetrikaEvent';
export const INNER_DATA_LAYER_TYPE_KEY = 'type';

export const pushToDataLayer = (dataLayer: any[], status: string) => {
    dataLayer.push({
        [INNER_DATA_LAYER_NAMESPACE]: {
            [INNER_DATA_LAYER_TYPE_KEY]: status,
        },
    });
};

export const getInnerDataLayer = (ctx: Window) => {
    const globalStorage = getGlobalStorage(ctx);
    const result: unknown[] = globalStorage.getVal(INNER_DATA_LAYER_KEY, []);
    globalStorage.setVal(INNER_DATA_LAYER_KEY, result);
    return result;
};

export type DataLayerObserverObject<T, U> = {
    observer: Observer<T, U>;
    unsubscribe: () => void;
};

export const dataLayerObserver = <T, U>(
    ctx: Window,
    array: T[],
    initCallback: (o: DataLayerObserverObject<T, U>) => void = noop,
    triggerBeforePush = false,
): DataLayerObserverObject<T, U> | undefined => {
    const dataObserver = observer<T, U>(ctx);
    if (!array || !isFunction(array.push)) {
        return undefined;
    }
    const newArray = array;
    const oldPush = array.push;
    newArray.push = function a(): number {
        // eslint-disable-next-line prefer-rest-params
        const arg = argsToArray(arguments);
        const [item] = arg;
        if (triggerBeforePush) {
            dataObserver.trigger(item);
        }
        const out = oldPush.apply(array, arg);
        if (!triggerBeforePush) {
            dataObserver.trigger(item);
        }
        return out;
    };
    const observerObject = {
        observer: dataObserver,
        unsubscribe: () => {
            newArray.push = oldPush;
        },
    };
    initCallback(observerObject);
    cForEach(dataObserver.trigger, array);

    return observerObject;
};
const toInner = (newEmitter: Emitter<MessageData, void>, item: any) => {
    const data = getPath(item, `${INNER_DATA_LAYER_NAMESPACE}`);
    if (!data) {
        return;
    }
    newEmitter.trigger(getPath(data, INNER_DATA_LAYER_TYPE_KEY), data);
};

export const innerDataLayerObserver = (
    ctx: Window,
    array: any[],
    initCallback: (e: Emitter<MessageData, void>) => void = firstArg,
) => {
    const eventEmitter = emitter<MessageData, void>(ctx);
    initCallback(eventEmitter);
    const handler = bindArg(eventEmitter, toInner);
    dataLayerObserver<MessageData, void>(
        ctx,
        array,
        (observerEmitter: DataLayerObserverObject<MessageData, void>) => {
            observerEmitter.observer.on(handler);
        },
    );
    return eventEmitter;
};
