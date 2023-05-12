export const GOAL_PROVIDER = 'g';

export const METHOD_NAME_GOAL = 'reachGoal';

export const DEFAULT_SCHEME_PREFIX = 'goal';

/**
 * Function to send information about goal reach (conversion)
 */
export type GoalHandler<T = any> = (
    /** Goal id in counter settings */
    goalName: string,
    /** Object or tree to be sent as plain arrays */
    rawParams?: Record<string, any> | (() => any),
    /** The function that will be called after sending the goal */
    rawCallback?: (() => any) | any,
    /** Callback context */
    rawFnCtx?: any,
) => T;

declare module 'src/utils/counter/type' {
    interface CounterObject {
        /** Transmits information about a completed goal (conversion) */
        [METHOD_NAME_GOAL]?: GoalHandler<CounterObject>;
    }
}
