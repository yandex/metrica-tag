import { getPerformance } from 'src/utils/time/performance';
import { TOO_LONG_ERROR_NAME, TOO_LONG_FUNCTION_EXECUTION } from './consts';
import { isNativeFunction } from '../function/isNativeFunction/isNativeFunction';
import { throwFunction } from './throwFunction';
import { runOnErrorCallbacks } from './onError';

/**
 * Tracks the current nesting level of decorated function calls
 */
let currentLevel = 0;
/**
 * Tracks the nesting level at which an execution time error was last thrown
 */
let executionTimeExceededOnLevel = 0;

/**
 * Threshold in milliseconds for considering a function execution as blocking the main thread
 */
const MAIN_THREAD_BLOCKING_THRESHOLD = 50;

/**
 * Accumulates the total time the main thread has been blocked by function executions
 */
let totalMainThreadBlocking = 0;
export const getMainThreadBlockingTime = () => {
    return Math.min(totalMainThreadBlocking, 100000);
};

export const executionTimeErrorDecorator = <
    FN extends (...args: unknown[]) => ReturnType<FN>,
>(
    fn: FN,
    scopeName: string,
    ctx: Window,
    callContext?: unknown,
) => {
    return function executionTimeErrorDecorated() {
        currentLevel += 1;
        let error = null;
        let result = null;
        const perf = getPerformance(ctx);
        const hasPerformance = perf ? isNativeFunction('now', perf.now) : false;

        try {
            const startTime = hasPerformance ? perf!.now() : 0;
            // eslint-disable-next-line prefer-rest-params, prefer-spread
            result = fn.apply(callContext || null, arguments as any);
            const endTime = hasPerformance ? perf!.now() : 0;
            const execTime = endTime - startTime;
            /*
                Check if we can throw execution time errors at this nesting level
                This prevents throwing errors in nested calls when an error was already thrown at a higher level
            */
            const canThrowExecTimeErrors =
                currentLevel > executionTimeExceededOnLevel;
            if (
                execTime >= TOO_LONG_FUNCTION_EXECUTION &&
                canThrowExecTimeErrors
            ) {
                executionTimeExceededOnLevel = currentLevel;
                if (hasPerformance) {
                    runOnErrorCallbacks(
                        'perf',
                        TOO_LONG_ERROR_NAME,
                        scopeName,
                        `${execTime}`,
                    );
                }
            }

            if (
                currentLevel === 1 &&
                execTime >= MAIN_THREAD_BLOCKING_THRESHOLD
            ) {
                totalMainThreadBlocking += execTime;
            }
        } catch (e) {
            error = e as Error;
        }

        currentLevel -= 1;
        /*
            Reset executionTimeExceededOnLevel when exiting a level where an error was thrown
            This allows throwing exceptions in different subtrees of the call hierarchy
        */
        if (currentLevel < executionTimeExceededOnLevel) {
            // Reset the execution time exceeded level to allow throwing exceptions in different subtrees
            executionTimeExceededOnLevel = currentLevel;
        }

        if (error) {
            throwFunction(error);
        }

        return result;
    } as FN;
};
