import { SENDER_COLLECT_FEATURE } from 'generated/features';
import { flags } from '@inject';

/**
 * Counter ID
 *
 * Value Type: number
 */
export const COUNTER_ID_PARAM = 'tid';

/**
 * Document location
 *
 * Value Type: string
 */
export const URL_PARAM = flags[SENDER_COLLECT_FEATURE] ? 'dl' : 'page-url';

/**
 * BrowserInfo object serialized into a string
 *
 * Value Type: string
 */
export const BROWSERINFO_QUERY_KEY = 'browser-info';

/**
 * Telemetry object serialized into a string
 *
 * Value Type: string
 */
export const TELEMETRY_QUERY_KEY = 't';

/**
 * API token required for authorized traffic
 *
 * Value Type: string
 */
export const CSRF_TOKEN_URL_PARAM = 'hittoken';

/**
 * Type of expected response
 *
 * Value Type: number
 */
export const REQUEST_MODE_KEY = flags[SENDER_COLLECT_FEATURE]
    ? '_wmode'
    : 'wmode';

/**
 * A parameter sent by sendBeacon transport,
 * indicating it always uses search query to deliver data.
 *
 * Value Type: 1
 */
export const FORCE_URLENCODED_KEY = flags[SENDER_COLLECT_FEATURE]
    ? '_fue'
    : 'force-urlencoded';

/**
 * The type of hit. Must be one of 'pageview', 'screenview', 'event', 'transaction', 'item', 'social', 'exception', 'timing'
 *
 * Value Type: string
 */
export const HIT_TYPE_KEY = 't';
export const HIT_TYPE_EVENT = 'event';

/**
 * Specifies the event action. Must not be empty for event hits.
 *
 * Value Type: string
 */
export const EVENT_ACTION_KEY = 'ea';

/**
 * Specifies the event label. Optional.
 *
 * Value Type: string
 */
export const EVENT_LABEL_KEY = 'el';

/**
 * Specifies the event action. Optional.
 *
 * Value Type: number
 */
export const EVENT_VALUE_KEY = 'ev';
