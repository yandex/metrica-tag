import { InternalTransportOptions } from 'src/transport/types';
import { getRandom } from 'src/utils/number';
import { dispatchDebuggerEvent } from './index';

export const debugLogRequest = (
    ctx: Window,
    url: string,
    senderParams: InternalTransportOptions,
) => {
    const requestId = getRandom(ctx);
    const { debugStack, rBody, rHeaders, rQuery, verb } = senderParams;
    dispatchDebuggerEvent(ctx, {
        ['name']: 'request',
        ['data']: {
            ['url']: url,
            ['requestId']: requestId,
            ['senderParams']: {
                ['rBody']: rBody,
                ['debugStack']: debugStack,
                ['rHeaders']: rHeaders,
                ['rQuery']: rQuery,
                ['verb']: verb,
            },
        },
    });
    return requestId;
};

export const logRequestSuccess = (
    ctx: Window,
    requestId: number,
    body?: any,
) => {
    dispatchDebuggerEvent(ctx, {
        ['name']: 'requestSuccess',
        ['data']: {
            ['body']: body,
            ['requestId']: requestId,
        },
    });
};

export const logRequestFailure = (
    ctx: Window,
    requestId: number,
    error: Error,
) => {
    dispatchDebuggerEvent(ctx, {
        ['name']: 'requestFail',
        ['data']: {
            ['error']: error,
            ['requestId']: requestId,
        },
    });
};
