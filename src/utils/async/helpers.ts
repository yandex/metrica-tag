import { iterForOf } from './iterator';
import { executeIterator } from './executor';
import { taskFork } from './task';
import { errorLogger } from '../errorLogger';
import { noop } from '../function';

export const iterateTaskWithConstraints = <T>(
    ctx: Window,
    collection: T[],
    callback: (item: T) => void,
    maxTime = 1,
    errorNamspace = 'itc',
) => {
    const iterator = iterForOf(collection, callback);
    const task = executeIterator(ctx, iterator, maxTime);
    task(taskFork(errorLogger(ctx, errorNamspace), noop));
};
