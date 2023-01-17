import { SENDER_COLLECT_FEATURE } from 'generated/features';
import { flags } from '@inject';
import { createMPQuery } from './measurementProtocol';
import { createWatchQuery } from './watchAPI';

export const createQuery = flags[SENDER_COLLECT_FEATURE]
    ? createMPQuery
    : createWatchQuery;
