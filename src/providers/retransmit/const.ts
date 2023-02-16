import { flags } from '@inject';
import { SENDER_COLLECT_FEATURE } from 'generated/features';
import { CLICKMAP_RESOURCE } from 'src/providers/clickmap/const';
import { COLLECT_RESOURCE } from 'src/middleware/senderCollectInfo';
import { WATCH_RESOURCE } from 'src/middleware/senderWatchInfo';
import { startsWith } from 'src/utils/string/startsWith';
import { equal } from 'src/utils/function';

export const RETRANSMIT_PROVIDER = 'r';

/**
 * A collection of callbacks verifying the counter is capable
 * of retransmitting requests with the specified resource.
 *
 * NOTE: The restriction is necessary to prevent attempts to retransmit
 * requests of a format a counter does not support.
 */
export const RETRANSMITTABLE_RESOURCE_CALLBACKS = flags[SENDER_COLLECT_FEATURE]
    ? [equal(COLLECT_RESOURCE)]
    : [startsWith(WATCH_RESOURCE), startsWith(CLICKMAP_RESOURCE)];
