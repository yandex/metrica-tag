import { cForEach } from '../array';
import { call, ctxBindArgs, firstArg, pipe } from '../function';

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
