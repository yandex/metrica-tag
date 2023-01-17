import { cont, curry2 } from '../function';
import { cForEach } from '../array';

export type ForkInterface<ResolveType> = (
    reject: (a?: any) => void,
    resolve: (a?: ResolveType) => void,
) => void;

export type TaskInterface<ResolveType> = <R>(
    fn: (forks: ForkInterface<ResolveType>) => R,
) => R;

export const task = cont as any as <ResolveType = any>(
    // eslint-disable-next-line no-use-before-define
    fork: ForkInterface<ResolveType>,
    // eslint-disable-next-line no-use-before-define
) => <R>(fn: (forks: ForkInterface<ResolveType>) => R) => R;

export const taskFork =
    <In>(reject: (a?: In) => void, resolve: (a?: In) => void) =>
    (fork: ForkInterface<In>) => {
        return fork(reject, resolve);
    };

export const taskMap = curry2((mapFn: Function, fork: Function) =>
    task((reject, resolve) => {
        return fork(reject, (result: any) => {
            try {
                resolve(mapFn(result));
            } catch (e) {
                reject(e);
            }
        });
    }),
) as any as <MapIn = any, MapOut = any>(
    mapFn: (a?: MapIn) => MapOut,
) => (
    fork: ForkInterface<MapIn>,
    // eslint-disable-next-line no-use-before-define
) => <R>(fn: (a: TaskInterface<MapIn>) => R) => R;

export const taskChain = curry2((fn: Function, fork: Function) =>
    task((reject, resolve) =>
        fork(reject, (result: any) => {
            try {
                fn(result)(taskFork(reject, resolve));
            } catch (e) {
                reject(e);
            }
        }),
    ),
) as any as <ChainIn = any, ChainOut = any>(
    fn: (chainResult?: ChainIn) => any,
) => (
    fork: ForkInterface<ChainIn>,
    // eslint-disable-next-line no-use-before-define
) => <R>(func: (a: TaskInterface<ChainOut>) => R) => R;

export const taskRace = <T>(tasks: TaskInterface<T>[]): TaskInterface<T> => {
    const rejectErrors: any[] = [];
    let isResolved = false;

    return task((reject, resolve) => {
        const onErrorCb = (error: any) => {
            const length = rejectErrors.push(error);
            if (length === tasks.length) {
                reject(rejectErrors);
            }
        };

        cForEach((taskItem, i) => {
            taskItem(
                taskFork(onErrorCb, (res?: T) => {
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
                taskFork(reject, (result?) => {
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

export const fromPromise = <T>(promise: Promise<T>) => {
    return task((reject, resolve) => {
        promise.then(resolve, reject);
    });
};

export const taskOf = (val?: any) =>
    task((reject, resolve) => {
        resolve(val);
    });
