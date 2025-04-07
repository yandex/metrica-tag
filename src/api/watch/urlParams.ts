import { flags } from '@inject';

export {
    URL_PARAM as WATCH_URL_PARAM,
    REQUEST_MODE_KEY,
} from '../common/urlParams';

/**
 * Document referrer
 *
 * Value Type: string
 */
export const WATCH_REFERER_PARAM = flags.SENDER_COLLECT_FEATURE
    ? 'dr'
    : 'page-ref';

/**
 * Document encoding
 *
 * Value Type: string
 */
export const WATCH_ENCODING_PARAM = 'charset';

/**
 * Counter class
 *
 * Value Type: 0 | 1
 */
export const WATCH_CLASS_PARAM = 'cnt-class';

/**
 * A flag indicating that the hit shall not be marked as a pageview
 *
 * Value Type: string
 */
export const DEFER_KEY = 'nohit';

/**
 * Parameters send with a hit
 *
 * Value Type: string
 */
export const REQUEST_BODY_KEY = flags.SENDER_COLLECT_FEATURE
    ? '_pa'
    : 'site-info';

/**
 * Deprecated
 */
export const NOINDEX_PARAM = 'ut';

// Hit types
export const HIT_TYPE_PAGEVIEW = 'pageview';

// Event actions
export const EVENT_ACTION_GOAL = 'goal';
