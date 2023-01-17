import { SENDER_COLLECT_FEATURE } from 'generated/features';
import { flags } from '@inject';

/**
 * Client time of a request
 *
 * Value Type: number
 */
export const SENDER_TIME_BR_KEY = 'st';

/**
 * Hashed combination of features in the script
 *
 * Value Type: string
 */
export const BUILD_FLAGS_BR_KEY = 'vf';

/**
 * Script version
 *
 * Value Type: string
 */
export const BUILD_VERSION_BR_KEY = 'v';

/**
 * User ID
 *
 * Value Type: string
 */
export const UID_BR_KEY = flags[SENDER_COLLECT_FEATURE] ? 'cid' : 'u';

/**
 * Timezone
 *
 * Value Type: number
 */
export const TIMEZONE_BR_KEY = flags[SENDER_COLLECT_FEATURE] ? 'tz' : 'z';

/**
 * Timestamp
 *
 * Value Type: string
 */
export const TIMESTAMP_BR_KEY = 'i';

/**
 * Event initialization time
 *
 * Value Type: number
 */
export const SECONDS_BR_KEY = 'et';

/**
 * Viewport size
 *
 * Value Type: string
 */
export const VIEWPORT_SIZE_BR_KEY = flags[SENDER_COLLECT_FEATURE] ? 'vp' : 'w';
