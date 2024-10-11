import { cReduce, dirtyReduce } from 'src/utils/array/reduce';
import { isNil } from './assertions';
import { curry2SwapArgs } from '../function/curry';
import { has } from './has';

// TODO Add enumerable entities support (for instance arrayLikeObject[1])
type GetPath<Value, Path extends string> =
    Path extends `${infer Head}.${infer Tail}`
        ? Head extends keyof Value
            ? GetPath<Exclude<Value[Head], undefined>, Tail>
            : null
        : Path extends keyof Value
        ? Exclude<Value[Path], undefined>
        : null;

/**
 * ВНИМАНИЕ! Использовать только для нативных функций/объектов или внешних данных
 * ВНИМАНИЕ! Обфускация может сделать путь невалидным
 * @param value
 * @param path
 */
export function getPath<Value, Path extends string>(
    value: Value,
    path: Path,
): GetPath<Value, Path> | null {
    if (!value) {
        return null;
    }
    return cReduce<string, GetPath<Value, Path>>(
        (out, step) => {
            if (isNil(out)) {
                return out;
            }

            try {
                return (out as any)[step];
            } catch (e) {
                // empty
            }

            return null;
        },
        value as any,
        path.split('.'),
    );
}

type CtxPath = {
    <C, P extends string>(path: P, ctx: C): GetPath<C, P>;
    <P extends string>(path: P): <C>(ctx: C) => GetPath<C, P>;
};

/**
 * @type function(...?): ?
 */
export const ctxPath: CtxPath = curry2SwapArgs(getPath) as CtxPath;
export const len = ctxPath('length') as <T>(
    obj: T,
) => T extends ArrayLike<unknown> ? number : unknown;

/**
 * Transform a list `[1,2,3]` into an object `{1: {2: 3}}`
 */
export const genPath = (path: (string | number)[], origCtx: any = {}) => {
    if (!path || path.length < 1) {
        return origCtx;
    }
    const splittedPath = path;
    dirtyReduce(
        (cParent, field, i) => {
            const parent = cParent;
            const isLast = i === splittedPath.length - 1;
            const isPrevLast = i === splittedPath.length - 2;
            if (isLast) {
                return parent;
            }
            if (isPrevLast) {
                parent[field] = splittedPath[i + 1];
            } else if (!has(parent, field)) {
                parent[field] = {};
            }
            return parent[field];
        },
        origCtx,
        splittedPath,
    );

    return origCtx;
};
