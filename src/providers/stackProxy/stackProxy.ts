import { config } from 'src/config';
import { yaNamespace } from 'src/const';
import {
    DEFAULT_COUNTER_TYPE,
    RSYA_COUNTER_TYPE,
} from 'src/providers/counterOptions/const';
import { cForEach } from 'src/utils/array/map';
import { toArray } from 'src/utils/array/utils';
import { getCounterInstance } from 'src/utils/counter/getInstance';
import { getCounterKey, isRsyaCounter } from 'src/utils/counterOptions';
import type { CounterOptions } from 'src/utils/counterOptions/types';
import { dataLayerObserver } from 'src/utils/dataLayerObserver/dataLayerObserver';
import { bindThisForMethod } from 'src/utils/function/bind/bind';
import { constructObject } from 'src/utils/function/construct';
import { curry2 } from 'src/utils/function/curry';
import { memo } from 'src/utils/function/memo';
import { pipe } from 'src/utils/function/pipe';
import { parseDecimalInt } from 'src/utils/number/number';
import { ctxPath, getPath, isFunction, mix } from 'src/utils/object';
import { stringIndexOf } from 'src/utils/string';
import { DUPLICATE_COUNTERS_CONSOLE_MESSAGE } from '../consoleRenderer/dictionary';
import { consoleLog } from '../debugConsole/debugConsole';
import { EXECUTED_PROP, STACK_DATA_LAYER_NAME, STACK_FN_NAME } from './const';
import type {
    CounterMethods,
    StackCall,
    StackCallOnInstance,
    StackProxyListener,
} from './types';

const stackProxyListeners: Record<string, StackProxyListener[]> = {};

export const addStackProxyListener = (
    method: CounterMethods,
    listener: StackProxyListener,
) => {
    if (!stackProxyListeners[method]) {
        stackProxyListeners[method] = [];
    }
    stackProxyListeners[method].push(listener);
};

export const getProxyState = memo(
    constructObject as (ctx: Window) => Record<
        string,
        {
            inited?: boolean;
            stackList?: StackCall[];
        }
    >,
);
const getCounterIdFromSrc = pipe(
    bindThisForMethod('exec', /counterID=(\d+)/),
    ctxPath('1'),
);

export const getCounterOptions = (
    counterKey: string | number,
): CounterOptions | undefined => {
    const counterKeyStr = `${counterKey}`;
    const urlCounterId = getCounterIdFromSrc(counterKeyStr);
    if (urlCounterId) {
        return {
            id: urlCounterId,
            counterType: DEFAULT_COUNTER_TYPE,
        };
    }

    if (stringIndexOf(counterKeyStr, ':') === -1) {
        const counterId = parseDecimalInt(counterKeyStr);
        if (!counterId) {
            return undefined;
        }
        return {
            id: counterId,
            counterType: DEFAULT_COUNTER_TYPE,
        };
    }

    const [id, classInfo] = counterKeyStr.split(':');
    const counterId = parseDecimalInt(id);
    if (!counterId) {
        return undefined;
    }
    return {
        id: counterId,
        counterType: isRsyaCounter(classInfo)
            ? RSYA_COUNTER_TYPE
            : DEFAULT_COUNTER_TYPE,
    };
};

export const handleCall = curry2((ctx: Window, item: StackCall) => {
    const arrayItem = toArray(item) as StackCall;
    const [counterKeyOrStaticMethod, ...rest] = arrayItem;

    const counterOptions = getCounterOptions(counterKeyOrStaticMethod);
    const anyCtx = ctx as any;
    const MetrikaConstructor = anyCtx[yaNamespace][config.constructorName];
    if (!counterOptions) {
        // Maybe static method
        const method = counterKeyOrStaticMethod;
        if (!isFunction(MetrikaConstructor[method])) {
            return;
        }

        MetrikaConstructor[method](...rest);
        return;
    }

    // Instance methods
    const counterKey = counterKeyOrStaticMethod;
    const [, method, ...args] = arrayItem as StackCallOnInstance;
    if (!method) {
        return;
    }

    const counter = getCounterInstance(ctx, counterOptions);
    const stateKey = getCounterKey(counterOptions);
    const state = getProxyState(ctx);
    if (!state[stateKey]) {
        state[stateKey] = {};
    }
    const counterInfo = state[stateKey];
    if (item[EXECUTED_PROP]) {
        return;
    }

    const listeners = stackProxyListeners[method];
    if (listeners) {
        for (let index = 0; index < listeners.length; index += 1) {
            const listener = listeners[index];
            const needExit = !!listener(ctx, counterOptions, args, counter);
            if (needExit) {
                return;
            }
        }
    }

    if (method === 'init') {
        item[EXECUTED_PROP] = true;
        if (counter) {
            consoleLog(
                ctx,
                `${counterKey}`,
                DUPLICATE_COUNTERS_CONSOLE_MESSAGE,
                { ['key']: counterKey },
            );
            return;
        }

        const options = args[0];
        const counterGlobalName = `yaCounter${counterOptions.id}`;
        anyCtx[counterGlobalName] = new MetrikaConstructor(
            mix({}, options, counterOptions),
        );
    } else if (counter && counter[method] && counterInfo.inited) {
        (counter[method] as any)(...args);
        item[EXECUTED_PROP] = true;
    } else {
        let { stackList } = counterInfo;
        if (!stackList) {
            stackList = [];
            counterInfo.stackList = stackList;
        }
        stackList.push(arrayItem);
    }
});

export const checkStack = (ctx: Window, counterOptions: CounterOptions) => {
    const state = getProxyState(ctx);
    const counterKey = getCounterKey(counterOptions);
    let counterInfo = state[counterKey];
    if (!counterInfo) {
        counterInfo = {};
        state[counterKey] = counterInfo;
    }
    // only first js file can handle items in stack
    counterInfo.inited = true;
    const { stackList } = counterInfo;
    if (!stackList) {
        return;
    }
    const onStack = handleCall(ctx);
    cForEach(onStack, stackList);
};

type StackFn = {
    [STACK_DATA_LAYER_NAME]: StackCall[];
};

/**
 * Handles ym(counterId, 'functionName', ...params) calls and proxies them to counter instance
 * @param ctx - Current window
 */
export const stackProxy = (ctx: Window) => {
    const fn = getPath(ctx, STACK_FN_NAME) as StackFn | null;
    if (!fn) {
        return;
    }
    let dataLayer: StackCall[] | null = getPath(fn, STACK_DATA_LAYER_NAME);
    if (!dataLayer) {
        fn[STACK_DATA_LAYER_NAME] = [];
        dataLayer = fn[STACK_DATA_LAYER_NAME] as StackCall[];
    }
    const onStack = handleCall(ctx);
    dataLayerObserver(
        ctx,
        dataLayer,
        ({ observer }) => {
            observer.on(onStack);
        },
        true,
    );
};
