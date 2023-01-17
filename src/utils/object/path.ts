import type { IsKeyOfObj } from 'src/utils/types';
import { cReduce } from 'src/utils/array/reduce';
import { isNil } from './assertions';
import { curry2SwapArgs } from '../function/curry';

/**
 * ВНИМАНИЕ! Использовать только для нативных функций/объектов или внешних данных
 * ВНИМАНИЕ! Обфускация может сделать путь невалидным
 * @param ctx
 * @param path
 */
export const getPath = (ctx: any, path: string) => {
    if (!ctx) {
        return null;
    }
    return cReduce(
        (out, step: string) => {
            if (isNil(out)) {
                return out;
            }

            try {
                return out[step];
            } catch (e) {
                // empty
            }

            return null;
        },
        ctx,
        path.split('.'),
    );
};

type CtxPath = {
    <C, P extends string>(path: P, ctx: C): IsKeyOfObj<P, C, any>;
    <P extends string>(path: P): <C>(ctx: C) => IsKeyOfObj<P, C, any>;
};

/**
 * @type function(...?): ?
 */
export const ctxPath: CtxPath = curry2SwapArgs(getPath);
export const len = ctxPath('length');

/**
 * Получаем из списка [1,2,3] объект {1: {2: 3}}
 * @param {string} path
 * @param {Object} [origCtx]
 */
export const genPath = (path: (string | number)[], origCtx: any = {}) => {
    if (!path || path.length < 1) {
        return origCtx;
    }
    const splittedPath = path;
    cReduce(
        (cParent, field, i) => {
            const parent = cParent;
            const isLast = i === splittedPath.length - 1;
            const isPrevLast = i === splittedPath.length - 2;
            if (isLast) {
                return parent;
            }
            if (isPrevLast) {
                parent[field] = splittedPath[i + 1];
            } else if (!parent[field]) {
                parent[field] = {};
            }
            return parent[field];
        },
        origCtx,
        splittedPath,
    );

    return origCtx;
};
