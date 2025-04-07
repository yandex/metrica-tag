import { cSome } from 'src/utils/array/some';
import { getNativeFunction } from 'src/utils/function/isNativeFunction/getNativeFunction';
import { flags } from '@inject';
import { dispatchDebuggerEvent } from 'src/utils/debugEvents';
import { bindArg } from 'src/utils/function/bind/bind';
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
import { stringIncludes } from '../string';

export const handleError = (ctx: Window, scopeName: string, e: LoggerError) => {
    if (flags.DEBUG_FEATURE) {
        if (flags.DEBUG_EVENTS_FEATURE) {
            dispatchDebuggerEvent(ctx, {
                ['data']: {
                    ['scopeName']: scopeName,
                    ['error']: e,
                },
                ['name']: 'error',
            });
        }
        // break promise catch exceptions
        const setTimeout: Window['setTimeout'] = getNativeFunction(
            'setTimeout',
            ctx,
        );
        // eslint-disable-next-line ban/ban
        return setTimeout(bindArg(e, throwFunction), 0);
    }

    if (
        flags.LOCAL_FEATURE &&
        flags.DEBUG_CONSOLE_FEATURE &&
        getPath(e, 'message') &&
        e.message !== TOO_LONG_ERROR_NAME &&
        !e[UNCATCHABLE_ERROR_PROPERTY]
    ) {
        // eslint-disable-next-line no-console
        console.error(e);
    }

    // Undefined as error
    let message = 'u.a.e';
    let stack = '';

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
            message = `${e}`;
        }
    }

    const ignoreCondition =
        isKnownError(message) ||
        cSome(bindArg(message, stringIncludes), IGNORED_ERRORS) ||
        (isHTTPError(message) && ctx.Math.random() >= 0.1);
    if (ignoreCondition) {
        return undefined;
    }

    runOnErrorCallbacks('jserrs', message, scopeName, stack);

    return undefined;
};
