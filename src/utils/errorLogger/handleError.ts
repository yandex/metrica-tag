import { cSome } from 'src/utils/array';
import {
    bindThisForMethod,
    notFn,
    equal,
    pipe,
    getNativeFunction,
    bindArg,
} from 'src/utils/function';
import {
    DEBUG_FEATURE,
    LOCAL_FEATURE,
    DEBUG_CONSOLE_FEATURE,
    DEBUG_EVENTS_FEATURE,
} from 'generated/features';
import { flags } from '@inject';
import { dispatchDebuggerEvent } from 'src/providers/debugEvents';
import { isKnownError } from './knownError';
import {
    TOO_LONG_ERROR_NAME,
    IGNORED_ERRORS,
    UNCATCHABLE_ERROR_PROPERTY,
} from './consts';
import { throwFunction } from './throwFunction';
import { isHTTPError, LoggerError } from './createError';
import { getPath } from '../object';
import { runOnErrorCallbacks } from './onError';

export const handleError = (ctx: Window, scopeName: string, e: LoggerError) => {
    // Undefined as error
    let message = 'u.a.e';
    let stack = '';

    if (
        flags[LOCAL_FEATURE] &&
        flags[DEBUG_CONSOLE_FEATURE] &&
        getPath(e, 'message') &&
        e.message !== TOO_LONG_ERROR_NAME &&
        !e[UNCATCHABLE_ERROR_PROPERTY]
    ) {
        // eslint-disable-next-line no-console
        console.error(e);
    }
    if (e) {
        if (typeof e === 'object') {
            if (e[UNCATCHABLE_ERROR_PROPERTY]) {
                throwFunction(e);
            }
            ({ message } = e);
            stack =
                (typeof e.stack === 'string' &&
                    e.stack.replace(/\n/g, '\\n')) ||
                'n.s.e.s';
        } else {
            message = `${e as any}`;
        }
    }

    // break promise catch exceptions
    if (flags[DEBUG_FEATURE]) {
        const setTimeout: Window['setTimeout'] = getNativeFunction(
            'setTimeout',
            ctx,
        );
        if (flags[DEBUG_EVENTS_FEATURE]) {
            dispatchDebuggerEvent(ctx, {
                data: {
                    scopeName,
                    error: e,
                },
                name: 'error',
            });
        }
        // eslint-disable-next-line ban/ban
        return setTimeout(bindArg(e, throwFunction), 0);
    }

    const ignoreCondition =
        isKnownError(message) ||
        cSome(
            pipe(
                bindThisForMethod('indexOf', message),
                equal(-1) as any,
                notFn,
            ),
            IGNORED_ERRORS,
        ) ||
        (isHTTPError(message) && ctx.Math.random() >= 0.1);
    if (ignoreCondition) {
        return undefined;
    }

    runOnErrorCallbacks('jserrs', message, scopeName, stack);

    return undefined;
};
