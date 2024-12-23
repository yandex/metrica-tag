import { ctxPath, getPath, mix } from 'src/utils/object';
import { dataLayerObserver } from 'src/utils/dataLayerObserver/dataLayerObserver';
import {
    CounterOptions,
    getCounterKey,
    isRsyaCounter,
} from 'src/utils/counterOptions';
import { getCounterInstance } from 'src/utils/counter/getInstance';
import { CounterObject } from 'src/utils/counter/type';
import { config } from 'src/config';
import { yaNamespace } from 'src/const';
import { memo } from 'src/utils/function/memo';
import { arrayMerge } from 'src/utils/array/merge';
import { toArray } from 'src/utils/array/utils';
import { cForEach } from 'src/utils/array/map';
import { cReduce } from 'src/utils/array/reduce';
import { parseDecimalInt } from 'src/utils/number/number';
import { stringIndexOf } from 'src/utils/string';
import { constructObject } from 'src/utils/function/construct';
import { bindThisForMethod } from 'src/utils/function/bind/bind';
import { pipe } from 'src/utils/function/pipe';
import { curry2 } from 'src/utils/function/curry';
import { DUPLICATE_COUNTERS_CONSOLE_MESSAGE } from '../consoleRenderer/dictionary';
import { consoleLog } from '../debugConsole/debugConsole';
import { DEFAULT_COUNTER_TYPE, RSYA_COUNTER_TYPE } from '../counterOptions';

export const STACK_FN_NAME = 'ym';
export const STACK_DATA_LAYER_NAME = 'a';
type CounterMethods = keyof CounterObject | 'init';
export type StackCall = [number | string, CounterMethods, ...any[]] & {
    /** Is call executed */
    executed?: boolean;
};
type StackProxyListener = (
    /** Current window */
    ctx: Window,
    /** Counter options on initialization */
    counterOptions: CounterOptions,
    /** Arguments */
    args: any[],
    /** Counter instance */
    counter?: CounterObject,
) => boolean | undefined;

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

export const getCounterAndOptions = (
    ctx: Window,
    counterKey: string | number,
) => {
    const counterKeyStr = `${counterKey}`;
    const counterOptions: CounterOptions = {
        id: 1,
        counterType: DEFAULT_COUNTER_TYPE,
    };
    const urlCounterId = getCounterIdFromSrc(counterKeyStr);
    if (urlCounterId) {
        counterOptions.id = urlCounterId;
    } else if (stringIndexOf(counterKeyStr, ':') === -1) {
        const counterId = parseDecimalInt(counterKeyStr);
        counterOptions.id = counterId;
    } else {
        const [id, classInfo] = counterKeyStr.split(':');
        counterOptions.id = parseDecimalInt(id);
        counterOptions.counterType = isRsyaCounter(classInfo)
            ? RSYA_COUNTER_TYPE
            : DEFAULT_COUNTER_TYPE;
    }
    return [getCounterInstance(ctx, counterOptions), counterOptions] as const;
};

export const handleCall = curry2((ctx: Window, item: StackCall) => {
    const anyCtx = ctx as any;
    const state = getProxyState(ctx);
    const [counterKey, method, ...args] = toArray(item) as StackCall;
    if (!method) {
        return;
    }
    const [counter, counterOptions] = getCounterAndOptions(ctx, counterKey);
    const stateKey = getCounterKey(counterOptions);
    if (!state[stateKey]) {
        state[stateKey] = {};
    }
    const counterInfo = state[stateKey];
    if (item.executed) {
        return;
    }

    if (stackProxyListeners[method]) {
        const exit = cReduce(
            (needExit, listener) => {
                return (
                    needExit || !!listener(ctx, counterOptions, args, counter)
                );
            },
            false,
            stackProxyListeners[method],
        );
        if (exit) {
            return;
        }
    }

    if (method === 'init') {
        item.executed = true;
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
        anyCtx[counterGlobalName] = new anyCtx[yaNamespace][
            config.constructorName
        ](mix({}, options, counterOptions));
    } else if (counter && counter[method] && counterInfo.inited) {
        (counter[method] as any)(...args);
        item.executed = true;
    } else {
        let { stackList } = counterInfo;
        if (!stackList) {
            stackList = [];
            counterInfo.stackList = stackList;
        }
        stackList.push(arrayMerge([counterKey, method], args));
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
