import {
    IterParams,
    iterIsEnd,
    iterForEachUntilMaxTime,
    iterResume,
    iterPopUntilMaxTime,
} from './iterator';
import { ForkInterface, task } from './task';
import { setDefer } from '../defer/defer';

type TaskExecutionFunction = () => void;

export const EXEC_TIMEOUT = 100;

const taskExecQueue: TaskExecutionFunction[] = [];
let executing = false;
let sync = false;

const addTaskToQueue = (taskExecFunction: TaskExecutionFunction) => {
    if (executing) {
        taskExecQueue.push(taskExecFunction);
    } else {
        executing = true;
        taskExecFunction();
    }
};

const runNextTask = (ctx: Window) => {
    if (taskExecQueue.length) {
        const taskExecFunction = taskExecQueue.shift();
        if (!sync) {
            setDefer(ctx, taskExecFunction!, EXEC_TIMEOUT);
        } else {
            taskExecFunction!();
        }
    } else {
        executing = false;
    }
};

/**
 * Asynchronous iteration queue. For a given iterator creates a task object.
 * The task creates a function upon execution, and the function is added to the global queue.
 * The queue is then processed in FIFO order.
 *
 * @param maxTime defines max time given for the iterator to run until execution is deferred.
 * Provide `Infinity` to trigger synchronous mode.
 */
export const executeIterator = <T>(
    ctx: Window,
    iterFn: <R>(a: (b: IterParams<T, any>) => R) => R,
    maxTime = 1,
    iterLoop:
        | typeof iterForEachUntilMaxTime
        | typeof iterPopUntilMaxTime = iterForEachUntilMaxTime,
) => {
    sync = maxTime === Infinity;

    const taskObj: ForkInterface<any[]> = (
        reject: (e: Error) => void,
        resolve: (a: any[]) => void,
    ) => {
        let result: any[] = [];

        const taskExecFunction: TaskExecutionFunction = () => {
            try {
                const items = iterFn(iterLoop(ctx, maxTime));
                result = result.concat(items);
            } catch (e) {
                return reject(e as Error);
            }

            iterFn(iterResume);
            if (iterFn(iterIsEnd)) {
                resolve(result);
                return runNextTask(ctx);
            }

            if (!sync) {
                setDefer(ctx, taskExecFunction, EXEC_TIMEOUT);
            } else {
                iterFn(iterLoop(ctx, 10000));
                resolve(result);
                runNextTask(ctx);
            }

            return undefined;
        };

        addTaskToQueue(taskExecFunction);
    };

    return task(taskObj);
};
