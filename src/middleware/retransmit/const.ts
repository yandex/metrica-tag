import { flags } from '@inject';
import { CLICKMAP_RESOURCE } from 'src/providers/clickmap/const';
import { COLLECT_RESOURCE } from 'src/middleware/senderCollectInfo';
import { WATCH_RESOURCE } from 'src/middleware/senderWatchInfo';
import { startsWithString } from 'src/utils/string/startsWith';
import { equal } from 'src/utils/function/curry';

/**
 * A collection of callbacks verifying the counter is capable
 * of retransmitting requests with the specified resource.
 *
 * NOTE: The restriction is necessary to prevent attempts to retransmit
 * requests of a format a counter does not support.
 */
export const RETRANSMITTABLE_RESOURCE_CALLBACKS = flags.SENDER_COLLECT_FEATURE
    ? [equal(COLLECT_RESOURCE)]
    : [startsWithString(WATCH_RESOURCE), startsWithString(CLICKMAP_RESOURCE)];

/**
 * Max count of requests in the storage
 */
export const MAX_REQUESTS = flags.DEBUG_FEATURE ? 2 : 100;

// 24 hours in ms
export const RETRANSMIT_EXPIRE = 24 * 60 * 60 * 1000;

export const RETRANSMIT_KEY = 'retryReqs';
