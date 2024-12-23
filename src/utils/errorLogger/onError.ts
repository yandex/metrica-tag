import { cForEach } from '../array/map';
import { ctxBindArgs } from '../function/bind/ctxBind';
import { firstArg } from '../function/identity';
import { pipe } from '../function/pipe';
import { call } from '../function/utils';

export type OnErrorCallback = (
    namespace: string,
    errorMessage: string,
    scope: string,
    stack?: string,
) => void;
export const ON_ERROR_CALLBACKS: OnErrorCallback[] = [];

export const runOnErrorCallbacks = (
    namespace: string,
    errorMessage: string,
    scope: string,
    stack?: string,
) => {
    const args = [namespace, errorMessage, scope, stack];
    cForEach(pipe(firstArg, ctxBindArgs(args), call), ON_ERROR_CALLBACKS);
};
