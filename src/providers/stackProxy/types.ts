import type { MetrikaCounter } from 'src/types';
import type { CounterObject } from 'src/utils/counter/type';
import { type CounterOptions } from 'src/utils/counterOptions';

export type CounterMethods = keyof CounterObject | 'init';
export type StaticMethods = keyof MetrikaCounter;
export type StackCallOnInstance = [number | string, CounterMethods, ...any[]];
export type StackCallStatic = [StaticMethods, ...any[]];
export type StackCall = (StackCallOnInstance | StackCallStatic) & {
    /** Is call executed */
    executed?: boolean;
};
export type StackProxyListener = (
    /** Current window */
    ctx: Window,
    /** Counter options on initialization */
    counterOptions: CounterOptions,
    /** Arguments */
    args: any[],
    /** Counter instance */
    counter?: CounterObject,
) => boolean | undefined;
