import { createError } from '../errorLogger';
import { throwFunction } from '../errorLogger/throwFunction';
import { bindArg, cont, curry2, firstArg } from '../function';
import { getMs, TimeOne } from '../time';

export type IterParams<T, R> = {
    itemList: T[];
    iterHandler: (item: T, next?: Function | any) => R;
    stopIter: boolean;
    iterCursor: number;
};

// остановлен ли итератор
export const iterIsEnd = <T, R>(iterParams: IterParams<T, R>) => {
    const params = iterParams;
    return params.stopIter || params.itemList.length <= params.iterCursor;
};
// останавливаем обход без возврата
export const iterBreak = <T, R>(iterParams: IterParams<T, R>) => {
    const params = iterParams;
    params.iterCursor = params.itemList.length;
};
// приостанавливаем итератор c возвратом
export const iterStop = <T, R>(rawParams: IterParams<T, R>) => {
    const params = rawParams;
    params.stopIter = true;
};
// восстанавливаем приостановленный итератор
export const iterResume = <T, R>(rawParams: IterParams<T, R>) => {
    const params = rawParams;
    params.stopIter = false;
};

// итерируем дальше
export const iterNext = <T, R>(rawParams: IterParams<T, R>) => {
    const params = rawParams;
    if (iterIsEnd(params)) {
        throwFunction(createError('i'));
    }
    const result = params.iterHandler(params.itemList[params.iterCursor]);
    params.iterCursor += 1;
    return result;
};

export const iterForEach = curry2(
    <T, R>(
        handler: (item: R, iterFn: Function) => T,
        params: IterParams<T, R>,
    ) => {
        const allResult: R[] = [];
        for (;;) {
            if (iterIsEnd(params)) {
                break;
            }
            const result = iterNext(params);
            handler(result, (fn: (a: IterParams<T, R>) => void) => fn(params));
            allResult.push(result);
        }
        return allResult;
    },
);

export const iterPop = (<T, R>(handler: (a: IterParams<T, R>) => R) =>
    (params: IterParams<T, R>) => {
        let result: R | undefined;
        while (params.itemList.length) {
            if (iterIsEnd(params)) {
                break;
            }
            const nexItem = params.itemList.pop();
            result = params.iterHandler(nexItem!, params.itemList);
            handler(params);
        }
        return result;
    }) as any as <T, R>(handler: (a: T) => R) => (a: IterParams<T, R>) => R[];

export const iterPopUntilMaxTime = (<T, R>(ctx: Window, maxTime: number) =>
    (params: IterParams<T, R>) => {
        const timer = TimeOne(ctx);
        const startTime = timer(getMs);
        return iterPop<T, void>((popParams) => {
            const time = timer(getMs) - startTime;
            if (time >= maxTime) {
                iterStop(popParams as any);
            }
        })(params);
    }) as any as (
    ctx: Window,
    maxTime: number,
    // eslint-disable-next-line no-use-before-define
) => <T, R>(params: IterParams<T, R>) => T[];

export const iterForEachUntilMaxTime = (<T, R>(ctx: Window, maxTime: number) =>
    (params: IterParams<T, R>) => {
        const timer = TimeOne(ctx);
        const startTime = timer(getMs);
        return (iterForEach as any)(
            (val: any, iterFn: (a: (b: IterParams<T, R>) => any) => any) => {
                const time = timer(getMs) - startTime;
                if (time >= maxTime) {
                    iterFn(iterStop);
                }
            },
        )(params);
    }) as (
    ctx: Window,
    maxTime: number,
    // eslint-disable-next-line no-use-before-define
) => <T, R>(params: IterParams<T, R>) => T[];

// Собственно в чём суть этого решения - это обычный обход по мидлварам с next,
// единственная разница в том, что он написан так чтобы развернуть рекурсию,
// потому что при рекурсии происходит переполнение стэка, часть с nextCallback
// ждёт когда вызвался next асинхронно. Если делать это традиционным образом
// и просто ждать вызова некст как коллбэка со следующим шагом получается
// слишком глубокая рекурсия.
export const iterNextCall = <T, R>(iterParams: IterParams<T, R>) => {
    let nextCalled = true;
    while (!iterIsEnd(iterParams) && nextCalled) {
        nextCalled = false;
        // eslint-disable-next-line no-loop-func
        let nextCallback = () => {
            nextCalled = true;
            iterParams.iterCursor += 1;
        };
        iterParams.iterHandler(
            iterParams.itemList[iterParams.iterCursor],
            () => {
                nextCallback();
            },
        );
        if (!nextCalled) {
            iterParams.iterCursor += 1;
            nextCallback = bindArg(
                iterParams as IterParams<unknown, unknown>,
                iterNextCall,
            );
        }
    }
};

export const iterForOf = <Item, Result>(
    itemList: Item[],
    handler: (a: Item, nextFn?: Function | any) => Result = firstArg as any,
) => {
    const iterParams = {
        itemList,
        iterHandler: handler,
        stopIter: false,
        iterCursor: 0,
    };
    return cont(iterParams) as any as <R>(
        fn: (a: IterParams<Item, Result>) => R,
    ) => R;
};
