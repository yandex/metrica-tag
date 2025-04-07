import { flags } from '@inject';
import { CLICKMAP_RESOURCE } from 'src/providers/clickmap/const';
import { COLLECT_RESOURCE } from 'src/middleware/senderCollectInfo';
import { WATCH_RESOURCE } from 'src/middleware/senderWatchInfo';
import { startsWithString } from 'src/utils/string/startsWith';
import { equal } from 'src/utils/function/curry';

export const RETRANSMIT_PROVIDER = 'r';
export const SENDER_RETRANSMIT = 'r';

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
