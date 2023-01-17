import { isNil } from 'src/utils/object';
import type { MiddlewareWeightTuple, MiddlewareGetter } from './types';

export const addMiddlewareToTheList = (
    list: MiddlewareWeightTuple[],
    middleware: MiddlewareGetter,
    weight: number,
) => {
    const resultTuple: MiddlewareWeightTuple = [middleware, weight];
    let prevWeight = -10000;
    for (let i = 0; i < list.length; i += 1) {
        const [currentMW, currentWeight] = list[i];
        if (weight === currentWeight && currentMW === middleware) {
            return;
        }

        if (weight < currentWeight && weight >= prevWeight) {
            list.splice(i, 0, resultTuple);
            return;
        }
        prevWeight = currentWeight;
    }
    list.push(resultTuple);
};

export const addMiddlewareFor = <K extends string>(
    middlewareList: Partial<Record<K, MiddlewareWeightTuple[]>>,
    key: K,
    middleware?: MiddlewareGetter,
    weight?: number,
) => {
    if (!middlewareList[key]) {
        middlewareList[key] = [];
    }
    if (middleware && !isNil(weight)) {
        addMiddlewareToTheList(middlewareList[key]!, middleware, weight!);
    }
};
