import { constructArray, globalMemoWin } from 'src/utils/function';
import { isCounterIdSilent } from 'src/utils/isCounterSilent';
import { parseIntSafe } from 'src/utils/number';
import { RSYA_COUNTER_TYPE } from 'src/providers/counterOptions/const';
import { flags } from '@inject';
import { DEBUG_EVENTS_FEATURE } from 'generated/features';
import { providersSync } from 'src/providersEntrypoint';
import { getCounterKey } from 'src/utils/counterOptions';
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
    const { counterKey } = event;
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
            const { id, counterType, webvisor, clickmap, trustedDomains } =
                counterOptions;
            dispatchDebuggerEvent(ctx, {
                ['counterKey']: getCounterKey(counterOptions),
                ['name']: 'counter',
                ['data']: {
                    ['id']: id,
                    ['counterType']: counterType,
                    ['webvisor']: webvisor,
                    ['trustedDomains']: trustedDomains,
                    ['clickmap']: clickmap,
                },
            });
        });
    }
};
