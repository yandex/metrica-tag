import type { SenderInfo } from 'src/sender/SenderInfo';
import type { CounterOptions } from 'src/utils/counterOptions';

export const BRINFO_LOGGER_PREFIX = 'bi';

export const LS_ID_KEY = 'lsid';
export const REQUEST_NUMBER_KEY = 'reqNum';

export type FlagGetter = (
    /** Current window */
    ctx: Window,
    /** Options passed for initialization */
    options: CounterOptions,
    /** Request context */
    senderParams: SenderInfo,
) => number | string | null;
export type FlagGettersHash = Record<string, FlagGetter>;
