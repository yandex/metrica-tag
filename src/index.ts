import { config } from 'src/config';
import {
    ProviderFunction,
    ProviderResult,
    ProviderResultPromised,
    MetrikaCounterConstructor,
} from 'src/types';
import { normalizeOptions, getCounterKey } from 'src/utils/counterOptions';
import {
    bindArgs,
    firstArg,
    pipe,
    call,
    ctxBindArgs,
} from 'src/utils/function';
import { entries, isFunction, isObject } from 'src/utils/object';
import { getGlobalStorage, yaNamespace } from 'src/storage/global';
import { HIT_PARAMS_KEY, LAST_REFERRER_KEY } from 'src/storage/global/consts';
import { useHitProvider } from 'src/providers/hit';
import { callbackInit } from 'src/providers/callbackInit';
import { COUNTERS_GLOBAL_KEY } from 'src/utils/counter';
import { CounterObject } from 'src/utils/counter/type';
import { consoleLog } from 'src/providers/debugConsole/debugConsole';
import { iterateTaskWithConstraints, runAsync } from 'src/utils/async';
import { TRACK_HASH_FEATURE, TELEMETRY_FEATURE } from 'generated/features';
import { optionsKeysMap } from 'src/providers/counterOptions';
import { flags } from '@inject';
import { telemetryCallCountDecorator } from 'src/utils/methodDecorators/telCallCount';
import {
    prioritizedProviders,
    beforeHitProviders,
    providersSync,
    providersAsync,
    staticMethodInitializers,
    windowProviderInitializers,
} from 'src/providersEntrypoint';
import { initImports } from 'generated/init';
import { UNSUBSCRIBE_PROPERTY } from 'src/providers/index';
import { METHOD_DESTRUCT } from './providers/destruct/const';
import { createError, errorLogger } from './utils/errorLogger';
import { destruct } from './providers/destruct';
import { selfReturnDecorator } from './utils/methodDecorators/selfReturn';
import { errorsDecorator } from './utils/methodDecorators/errors';
import { decoratorPipe } from './utils/methodDecorators/decoratorPipe';
import { destructingDecorator } from './utils/methodDecorators/destructing';

import { throwKnownError } from './utils/errorLogger/knownError';
import { cForEach, cMap } from './utils/array';
import { throwFunction } from './utils/errorLogger/throwFunction';

type CounterMethod = keyof CounterObject;
const globalConfig = getGlobalStorage(window);

globalConfig.setSafe(HIT_PARAMS_KEY, {});

if (flags[TRACK_HASH_FEATURE]) {
    globalConfig.setSafe(LAST_REFERRER_KEY, window.location.href);
}

initImports();

// Надёжнее всего просто по одной таски запускать
// Потому что там есть переходы из потоков выполнения которые
// Не измеряются нормально
const ASYNC_PROVIDERS_MAX_EXEC_TIME = 1;

const MetrikaCounter: MetrikaCounterConstructor = function MetrikaCounter(
    counterId,
    counterParams?,
    counterType?,
    counterDefer?,
) {
    // eslint-disable-next-line consistent-return
    return errorLogger(window, 'c.i', () => {
        const ctx = window;
        // eslint-disable-next-line no-restricted-globals
        if (!ctx || (isNaN(counterId) && !counterId)) {
            // Браузер из ада, или настройки пустые
            throwKnownError();
        }
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const thisInstance = this;
        const counterOptions = normalizeOptions(
            counterId,
            optionsKeysMap,
            counterParams,
            counterType,
            counterDefer,
        );

        const unsubscribeMethods: Array<Function | undefined> = [];

        const decorators = [
            errorsDecorator,
            destructingDecorator,
            selfReturnDecorator,
        ];

        if (flags[TELEMETRY_FEATURE]) {
            decorators.push(telemetryCallCountDecorator);
        }

        const initMethod = <FN extends (...args: any) => ReturnType<FN>>(
            method: FN,
            methodName: keyof CounterObject,
            extraDecorators?: any[],
        ) => {
            thisInstance[methodName] = decoratorPipe(
                ctx,
                counterOptions,
                extraDecorators || decorators,
                methodName,
                method,
            );
        };

        const handleProviderResult = (providerResult: ProviderResult) => {
            if (providerResult) {
                if (isFunction(providerResult)) {
                    unsubscribeMethods.push(providerResult);
                } else if (isObject(providerResult)) {
                    cForEach(([methodName, method]) => {
                        if (isFunction(method)) {
                            if (methodName === UNSUBSCRIBE_PROPERTY) {
                                unsubscribeMethods.push(method);
                            } else {
                                initMethod(method, methodName as CounterMethod);
                            }
                        }
                    }, entries(providerResult));
                }
            }
        };

        const callProvider = (fn: ProviderFunction) => {
            const result = destructingDecorator<ProviderFunction>(
                ctx,
                counterOptions,
                '',
                fn,
            )(ctx, counterOptions);
            if (result) {
                if (isFunction((result as ProviderResultPromised).then)) {
                    (result as ProviderResultPromised).then(
                        handleProviderResult,
                    );
                } else {
                    handleProviderResult(result as ProviderResult);
                }
            }

            return result;
        };
        const asyncProvidersInit: ProviderFunction[] = cMap(
            firstArg,
            providersAsync,
        );

        const counterKey = getCounterKey(counterOptions);
        if (!counterOptions.id) {
            throwFunction(
                createError(`Invalid Metrika id: ${counterOptions.id}`, true),
            );
        }
        const counters = globalConfig.getVal<Record<string, any>>(
            COUNTERS_GLOBAL_KEY,
            {},
        );

        if (counters[counterKey]) {
            consoleLog(
                ctx,
                counterKey,
                `Duplicate counter ${counterKey} initialization`,
            );
            return counters[counterKey];
        }

        counters[counterKey] = this;
        globalConfig.setVal(COUNTERS_GLOBAL_KEY, counters);
        globalConfig.setSafe('counter', this);

        cForEach((provider) => {
            provider(ctx, counterOptions);
        }, prioritizedProviders);

        cForEach(callProvider, beforeHitProviders);

        // hit
        callProvider(useHitProvider);

        // destruct
        initMethod(
            destruct(ctx, counterOptions, unsubscribeMethods),
            METHOD_DESTRUCT,
            [errorsDecorator, selfReturnDecorator],
        );

        runAsync(
            ctx,
            bindArgs(
                [
                    ctx,
                    asyncProvidersInit,
                    callProvider,
                    ASYNC_PROVIDERS_MAX_EXEC_TIME,
                    'a.i',
                ],
                iterateTaskWithConstraints,
            ),
        );

        cForEach(callProvider, providersSync);

        return undefined;
    })();
};

if (window[yaNamespace] && MetrikaCounter) {
    const { constructorName } = config;

    window[yaNamespace]![constructorName] = MetrikaCounter;
    callbackInit(window);

    const counterConstructor = window[yaNamespace]![constructorName];

    cForEach(
        pipe(ctxBindArgs([window, counterConstructor]), call),
        staticMethodInitializers,
    );
}

cForEach(pipe(ctxBindArgs([window]), call), windowProviderInitializers);
