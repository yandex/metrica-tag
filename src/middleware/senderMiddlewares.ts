import { SENDER_COLLECT_FEATURE } from 'generated/features';
import { flags } from '@inject';
import {
    Middleware,
    MiddlewareGetter,
    MiddlewareWeightTuple,
} from 'src/middleware/types';
import { SENDER_WATCH } from 'src/sender/const';
import type { SenderMap, Sender } from 'src/sender/types';
import type { CounterOptions } from 'src/utils/counterOptions';
import { cMap, head } from 'src/utils/array';
import { pipe, ctxBindArgs, call, bindArg } from 'src/utils/function';
import { senderCollectInfo } from './senderCollectInfo';
import { senderWatchInfo } from './senderWatchInfo';
import { addMiddlewareFor } from './utils';

const hitSenderInfo = flags[SENDER_COLLECT_FEATURE]
    ? senderCollectInfo
    : senderWatchInfo;

/** The mapping between sender and corresponding middleware list */
export const senderMiddlewareList: SenderMap<MiddlewareWeightTuple[]> = {
    [SENDER_WATCH]: [[hitSenderInfo, 1]],
};

/** Add new middleware for the provided sender to the mapping
 * - NOTE: It mutates `senderMiddlewareList` (the mapping)
 * - NOTE: Middlewares are sorted with ascending weight
 * @param providerName - Unique sender name
 * @param middleware
 * @param weight
 */
export const addMiddlewareForSender: (
    providerName: Sender,
    middleware?: MiddlewareGetter,
    weight?: number,
) => void = bindArg(senderMiddlewareList, addMiddlewareFor);

/**
 * Get a middleware for the provided sender from the mapping
 */
export const getSenderMiddlewares = (
    ctx: Window,
    sender: Sender,
    opt: CounterOptions,
): Middleware[] =>
    cMap(
        pipe(head, ctxBindArgs([ctx, opt]), call),
        senderMiddlewareList[sender] || [],
    );
