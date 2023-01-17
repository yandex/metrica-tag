import { InternalTransportOptions } from 'src/transport/types';
import { getRandom } from 'src/utils/number';
import { dispatchDebuggerEvent } from './index';

export const debugLogRequest = (
    ctx: Window,
    url: string,
    senderParams: InternalTransportOptions,
) => {
    const requestId = getRandom(ctx);
    dispatchDebuggerEvent(ctx, {
        name: 'request',
        data: {
            url,
            requestId,
            senderParams,
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
        name: 'requestSuccess',
        data: {
            body,
            requestId,
        },
    });
};

export const logRequestFailure = (
    ctx: Window,
    requestId: number,
    error: Error,
) => {
    dispatchDebuggerEvent(ctx, {
        name: 'requestFail',
        data: {
            error,
            requestId,
        },
    });
};
