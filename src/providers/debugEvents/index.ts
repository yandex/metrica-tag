import { flags } from '@inject';
import { DEBUG_EVENTS_FEATURE, DEBUG_FEATURE } from 'generated/features';
import { RSYA_COUNTER_TYPE } from 'src/providers/counterOptions/const';
import { providersSync } from 'src/providersEntrypoint';
import { getCounterKey } from 'src/utils/counterOptions';
import { constructArray, globalMemoWin } from 'src/utils/function';
import { isCounterIdSilent } from 'src/utils/isCounterSilent';
import { parseIntSafe } from 'src/utils/number';
import { getOriginalOptions } from 'src/providers/counterOptions';
import { debugEnabled } from 'src/providers/debugConsole/debugEnabled';
import { DebuggerEvent } from './types';

const MAX_EVENT_NUMBER = 1000;

export const getEvents = globalMemoWin<DebuggerEvent[]>(
    'debuggerEvents',
    constructArray,
    true,
);

/**
 * Adds an event to a globally accessible array for debugging
 * @param ctx - Current window
 * @param event - Event parameters
 */
export const dispatchDebuggerEvent = (ctx: Window, event: DebuggerEvent) => {
    if (!flags[DEBUG_FEATURE] && !debugEnabled(ctx)) {
        return;
    }

    // eslint-disable-next-line prefer-destructuring
    const counterKey = event['counterKey'];

    if (counterKey) {
        const [counterId, counterType] = counterKey.split(':');
        const isSilent = isCounterIdSilent(parseIntSafe(counterId)!);
        const isRsya = counterType === RSYA_COUNTER_TYPE;
        if (isRsya || isSilent) {
            return;
        }
    }
    const events = getEvents(ctx);
    if (events.length === MAX_EVENT_NUMBER) {
        events.shift();
    }
    events.push(event);
};

export const initProvider = () => {
    if (flags[DEBUG_EVENTS_FEATURE]) {
        providersSync.push((ctx, counterOptions) => {
            dispatchDebuggerEvent(ctx, {
                ['counterKey']: getCounterKey(counterOptions),
                ['name']: 'counter',
                ['data']: getOriginalOptions(counterOptions),
            });
        });
    }
};
