export {
    TRANSPORT_ID_BR_KEY,
    RETRANSMIT_BRINFO_KEY,
} from '../common/telemetry';

/**
 * A flag indicating whether notBounce hit was send with experimental timeout
 *
 * Value Type: 0 | 1
 */
export const NOT_BOUNCE_TELEMETRY_EXP_BR_KEY = 'nbe';

/**
 * Debugging info for clickmaps
 *
 * Value Type: string
 */
export const CLMAP_CLICKS_TEL_KEY = 'clc';

/**
 * Call count metric for each counter method
 *
 * Value Type: number
 */
export const METHODS_CALLED_TEL_KEY = 'mc';

/**
 * A flag indicating whether uid value was recovered from localStorage
 *
 * Value Type: 1
 */
export const IS_RECOVERED_ID_KEY = 're';

/**
 * A flag indicating whether a hit is sent from active window or not
 *
 * Value Type: 0 | 1
 */
export const IS_ACTIVE_WINDOW_TEL_KEY = 'aw';

/**
 * Request count of a counter on a page
 *
 * Value Type: number
 */
export const REQUEST_NUMBER_TEL_KEY = 'rqnt';

/**
 * Main thread blocking time of the metrika script
 *
 * Value Type: number
 */
export const MAIN_THREAD_BLOCKING_TIME_TEL_FEATURE = 'mtb';

/**
 * The presence of old code on the page.
 *
 * Value Type: 1
 */
export const OLD_CODE_TEL_KEY = 'oc';

/**
 * Access attempts to oldCode property.
 *
 * Value Type: 0 | 1
 */
export const OLD_CODE_ACCESS_TEL_KEY = 'oca';
