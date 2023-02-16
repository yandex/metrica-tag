import { MiddlewareBasedSender, useMiddlewareBasedSender } from '../middleware';
import { SENDER_WATCH } from '../const';

export type SenderWatch = MiddlewareBasedSender;

export const useSenderWatch = useMiddlewareBasedSender(SENDER_WATCH);
