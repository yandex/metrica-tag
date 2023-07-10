import { CounterOptions } from 'src/utils/counterOptions/types';
import { SenderInfo } from 'src/sender/SenderInfo';

export type MiddlewareHandler = (
    /** Request context */
    senderParams: SenderInfo,
    /** Callback */
    next: () => void,
) => void;

export type Middleware = {
    /** Handler to run before request
     * - NOTE: This function mutates the `senderParams` parameter
     */
    beforeRequest?: MiddlewareHandler;
    /** Handler to run after request
     * - NOTE: This function mutates the `senderParams` parameter
     */
    afterRequest?: MiddlewareHandler;
};

export type MiddlewareGetter = (ctx: Window, opt: CounterOptions) => Middleware;

export type MiddlewareWeightTuple = [
    middleware: MiddlewareGetter,
    weight: number,
];
