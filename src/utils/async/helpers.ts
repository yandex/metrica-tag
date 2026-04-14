import { iterForOf } from './iterator';
import { executeIterator } from './executor';
import { taskFork } from './task';
import { errorLogger } from '../errorLogger/errorLogger';
import { noop } from '../function/noop';

export const iterateTaskWithConstraints = <T>(
    ctx: Window,
    collection: T[],
    callback: (item: T) => void,
    errorNamespace: string,
    maxTime = 1,
    resolveCallback = noop,
) => {
    const iterator = iterForOf(collection, callback);
    const task = executeIterator(
        ctx,
        iterator,
        `${errorNamespace}.itc`,
        maxTime,
    );
    task(taskFork(errorLogger(ctx, errorNamespace), resolveCallback));
};
