import { cForEach } from '../array/map';
import { cont, curry2 } from '../function/curry';

export type ForkInterface<ResolveType, RejectType = unknown> = (
    reject: (a: RejectType) => void,
    resolve: (a: ResolveType) => void,
) => void;

export type TaskInterface<ResolveType, RejectType = unknown> = <R>(
    fn: (forks: ForkInterface<ResolveType, RejectType>) => R,
) => R;

export const task = cont as <ResolveType, RejectType = unknown>(
    fork: ForkInterface<ResolveType, RejectType>,
) => TaskInterface<ResolveType, RejectType>;

export const taskFork =
    <In, E = unknown>(reject: (a: E) => void, resolve: (a: In) => void) =>
    (fork: ForkInterface<In, E>) =>
        fork(reject, resolve);

export const taskMap = curry2(
    <MapIn, MapOut>(mapFn: (a: MapIn) => MapOut, fork: ForkInterface<MapIn>) =>
        task<MapOut>((reject, resolve) =>
            fork(reject, (result) => {
                try {
                    resolve(mapFn(result));
                } catch (e) {
                    reject(e);
                }
            }),
        ),
);

export const taskChain = curry2(
    <ChainIn, ChainOut, E = unknown>(
        fn: (chainResult: ChainIn) => TaskInterface<ChainOut, E>,
        fork: ForkInterface<ChainIn>,
    ) =>
        task<ChainOut>((reject, resolve) =>
            fork(reject, (result) => {
                try {
                    fn(result)(taskFork<ChainOut, E>(reject, resolve));
                } catch (e) {
                    reject(e);
                }
            }),
        ),
);

export const taskRace = <T>(tasks: TaskInterface<T>[]) => {
    const rejectErrors: unknown[] = [];
    let isResolved = false;

    return task<T, unknown[]>((reject, resolve) => {
        const onErrorCb = (error: unknown) => {
            const length = rejectErrors.push(error);
            if (length === tasks.length) {
                reject(rejectErrors);
            }
        };

        cForEach((taskItem, i) => {
            taskItem(
                taskFork(onErrorCb, (res: T) => {
                    if (!isResolved) {
                        try {
                            resolve(res);
                            isResolved = true;
                        } catch (e) {
                            onErrorCb(e);
                        }
                    }
                }),
            );
        }, tasks);
    });
};

export const taskAll = <T>(tasks: TaskInterface<T>[]): TaskInterface<T[]> => {
    const results: T[] = [];
    let counter = 0;
    return task((reject, resolve) => {
        cForEach((taskItem, i) => {
            taskItem(
                taskFork(reject, (result) => {
                    try {
                        results[i] = result;
                        counter += 1;
                        if (counter === tasks.length) {
                            resolve(results);
                        }
                    } catch (e) {
                        reject(e);
                    }
                }),
            );
        }, tasks);
    });
};

export const fromPromise = <T>(promise: Promise<T>) =>
    task<T>((reject, resolve) => {
        promise.then(resolve, reject);
    });

export const taskOf = <T>(val: T) =>
    task<T>((reject, resolve) => {
        resolve(val);
    });
