import { flags } from '@inject';
import { DEBUG_FEATURE } from 'generated/features';
import { RSYA_COUNTER_TYPE } from 'src/providers/counterOptions/const';
import { globalMemoWin } from 'src/utils/function/globalMemo';
import { isCounterIdSilent } from 'src/utils/isCounterSilent';
import { parseIntSafe } from 'src/utils/number/number';
import { debugEnabled } from 'src/providers/debugConsole/debugEnabled';
import { constructArray } from 'src/utils/function/construct';
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
