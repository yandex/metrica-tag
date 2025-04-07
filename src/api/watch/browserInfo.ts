import { flags } from '@inject';
import { NOINDEX_PARAM } from './urlParams';

export {
    SENDER_TIME_BR_KEY,
    BUILD_FLAGS_BR_KEY,
    BUILD_VERSION_BR_KEY,
    UID_BR_KEY,
    TIMEZONE_BR_KEY,
    TIMESTAMP_BR_KEY,
    SECONDS_BR_KEY,
    VIEWPORT_SIZE_BR_KEY,
} from '../common/browserInfo';

/**
 * Pageview
 *
 * Value Type: 1
 */
export const PAGE_VIEW_BR_KEY = 'pv';

/**
 * Artificial hit
 *
 * Value Type: 1
 */
export const ARTIFICIAL_BR_KEY = 'ar';

/**
 * A hit with parameters
 *
 * Value Type: 1
 */
export const PARAMS_BR_KEY = 'pa';

/**
 * Location hash changed event
 *
 * Value Type: 1
 */
export const TRACK_HASH_BR_KEY = 'wh';

/**
 * Not bounce event
 *
 * Value Type: 1
 */
export const NOT_BOUNCE_BR_KEY = 'nb';

/**
 * Client time during not bounce event
 *
 * Value Type: number
 */
export const NOT_BOUNCE_CLIENT_TIME_BR_KEY = 'cl';

/**
 * Download link click event
 *
 * Value Type: 1
 */
export const IS_DOWNLOAD_BR_KEY = flags.SENDER_COLLECT_FEATURE ? 'dwl' : 'dl';

/**
 * External link click event
 *
 * Value Type: 1
 */
export const IS_EXTERNAL_LINK_BR_KEY = 'ln';

/**
 * A flag indicating presence of Ya.Direct ads
 *
 * Value Type: 1
 */
export const AD_BR_KEY = 'ad';

/**
 * Deprecated
 *
 * Value Type: 1
 */
export const NOINDEX_BR_KEY = NOINDEX_PARAM;

/**
 * Document title
 *
 * Value Type: string
 */
export const TITLE_BR_KEY = flags.SENDER_COLLECT_FEATURE ? 'dt' : 't';

/**
 * A flag indicating prerender state being registered
 *
 * Value Type: 1
 */
export const PRERENDER_MW_BR_KEY = 'pr';

/**
 * Network connection type
 *
 * Value Type: string
 */
export const NET_TYPE_BR_KEY = 'nt';

/**
 * First paint time
 *
 * Value Type: number
 */
export const FIRST_PAINT_BR_KEY = 'fp';

/**
 * A flag indication url or referrer override
 *
 * Value Type: number
 */
export const FALSE_URL_BR_KEY = 'fu';

/**
 * Document encoding
 *
 * Value Type: string
 */
export const DOCUMENT_ENCODING_BR_KEY = flags.SENDER_COLLECT_FEATURE
    ? 'de'
    : 'en';

/**
 * Browser language
 *
 * Value Type: string
 */
export const BROWSER_LANGUAGE_BR_KEY = flags.SENDER_COLLECT_FEATURE
    ? 'ul'
    : 'la';

/**
 * Counter number
 *
 * Value Type: number
 */
export const COUNTER_NUMBER_BR_KEY = 'cn';

/**
 * A flag differentiating mobile and desktop browsers
 *
 * Value Type: 0 | 1
 */
export const IS_DESKTOP_BR_KEY = 'dp';

/**
 * LocalStorage ID for the counter
 *
 * Value Type: number
 */
export const LS_ID_BR_KEY = 'ls';

/**
 * Hit ID
 *
 * Value Type: number
 */
export const HID_BR_KEY = 'hid';

/**
 * Cookies are enabled
 *
 * Value Type: 1
 */
export const COOKIES_ENABLED_BR_KEY = 'c';

/**
 * Random number for cash busting
 *
 * Value Type: number
 */
export const RANDOM_NUMBER_BR_KEY = flags.SENDER_COLLECT_FEATURE ? 'z' : 'rn';

/**
 * Random number in a sequence within a single page view
 *
 * Value Type: number
 */
export const REQUEST_NUMBER_BR_KEY = 'rqn';

/**
 * Is turbo page
 *
 * Value Type: 1
 */
export const IS_TURBO_PAGE_BR_KEY = 'tp';

/**
 * Turbo page ID
 *
 * Value Type: number
 */
export const TURBO_PAGE_ID_BR_KEY = 'tpid';

/**
 * Screen size
 *
 * Value Type: string
 */
export const SCREEN_SIZE_BR_KEY = flags.SENDER_COLLECT_FEATURE ? 'sr' : 's';

/**
 * Device pixel ratio
 *
 * Value Type: number
 */
export const DEVICE_PIXEL_RATIO_BR_KEY = 'sk';

/**
 * The page is within an iframe
 *
 * Value Type: 1
 */
export const IS_IFRAME_BR_KEY = 'ifr';

/**
 * Java enabled
 *
 * Value Type: 1
 */
export const IS_JAVA_ENABLED_BR_KEY = flags.SENDER_COLLECT_FEATURE ? 'je' : 'j';

/**
 * Is iframe context of the same origin as top window
 *
 * Value Type: 1
 */
export const IS_SAME_ORIGIN_AS_TOP_WINDOW_BR_KEY = 'sti';

/**
 * Hit ID of the parent window counter (sent by a counter within iframe context)
 *
 * Value Type: number
 */
export const PARENT_HID_BR_KEY = 'phid';

/**
 * The flag contains the value of the `isTrusted` property from the native event type.
 *
 * [MDN Docs](https://developer.mozilla.org/ru/docs/Web/API/Event/isTrusted)
 *
 * Value Type: number (true = 1, false = 0)
 */
export const IS_TRUSTED_EVENT_BR_KEY = 'ite';
