import { getPerformance } from 'src/utils/time/performance';
import { TOO_LONG_ERROR_NAME, TOO_LONG_FUNCTION_EXECUTION } from './consts';
import { isNativeFunction } from '../function';
import { throwFunction } from './throwFunction';
import { runOnErrorCallbacks } from './onError';

// Эта логика нужна чтобы не кидать одно и то же исключение о превышении
// времени выполнения в нескольких скоупах сразу
let currentLevel = 0;
let executionTimeExceededOnLevel = 0;

const MAIN_THREAD_BLOCKING_THRESHOLD = 50;

let totalMainThreadBlocking = 0;
export const getMainThreadBlockingTime = () => {
    return Math.min(totalMainThreadBlocking, 100000);
};

export const executionTimeErrorDecorator = <
    FN extends (...args: any) => ReturnType<FN>,
>(
    fn: FN,
    scopeName: string,
    ctx: Window,
    callContext?: any,
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

            const canThrowExecTimeErrors =
                currentLevel > executionTimeExceededOnLevel;
            if (
                execTime >= TOO_LONG_FUNCTION_EXECUTION &&
                canThrowExecTimeErrors
            ) {
                executionTimeExceededOnLevel = currentLevel;
                if (hasPerformance && !(endTime % 1000)) {
                    runOnErrorCallbacks('perf', TOO_LONG_ERROR_NAME, scopeName);
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
        if (currentLevel < executionTimeExceededOnLevel) {
            // Для того чтобы в разных поддеревьях можно было бросать эксепшены
            executionTimeExceededOnLevel = currentLevel;
        }

        if (error) {
            throwFunction(error);
        }

        return result;
    } as any;
};
