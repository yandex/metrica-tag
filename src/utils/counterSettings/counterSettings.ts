import { flags } from '@inject';
import { dispatchDebuggerEvent } from 'src/utils/debugEvents';
import { mix } from 'src/utils/object';
import { type CounterOptions, getCounterKey } from '../counterOptions';
import { getMs, TimeOne } from '../time/time';
import type { CounterSettings } from './types';
import { AsyncMapFn, getAsync, setAsync } from '../asyncMap';
import { counterTimingStore } from '../counterTimings';

export const setSettingsRaw = (
    counterKey: string,
    settings: CounterSettings,
) => {
    const settingsStorage = AsyncMapFn<CounterSettings>();
    return settingsStorage(setAsync(counterKey, settings));
};

export const setSettings = (
    ctx: Window,
    counterOptions: CounterOptions,
    rawSettings: CounterSettings,
) => {
    const counterKey = getCounterKey(counterOptions);
    counterTimingStore(counterKey).firstHitClientTime = TimeOne(ctx)(getMs);
    const settings = mix({}, rawSettings);

    if (flags.DEBUG_EVENTS_FEATURE) {
        dispatchDebuggerEvent(ctx, {
            ['counterKey']: counterKey,
            ['name']: 'counterSettings',
            ['data']: {
                ['settings']: settings,
            },
        });
    }

    return setSettingsRaw(counterKey, settings);
};

export const getCounterSettings = <R>(
    counterOptions: CounterOptions,
    callBack: (opt: CounterSettings) => R,
): Promise<R> => {
    const counterKey = getCounterKey(counterOptions);
    const settingsStorage = AsyncMapFn<CounterSettings>();
    return settingsStorage(getAsync(counterKey)).then(callBack);
};
