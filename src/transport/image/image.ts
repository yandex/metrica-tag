import { REQUEST_MODE_KEY } from 'src/api/common';
import { CheckTransport, InternalTransportOptions } from 'src/transport/types';
import { mix } from 'src/utils/object';
import { PolyPromise } from 'src/utils/promise';
import { setDeferBase } from 'src/utils/defer/base';
import { bindArg, bindArgs } from 'src/utils/function/bind';
import { isSafari } from 'src/utils/browser/browser';
import {
    getElemCreateFunction,
    removeNode,
    getRootElement,
} from 'src/utils/dom/dom';
import { createKnownError } from 'src/utils/errorLogger/knownError';
import { clearDefer } from 'src/utils/defer/defer';
import { pipe } from 'src/utils/function/pipe';
import { getSrcUrl } from '../watchModes';

const request = (
    ctx: Window,
    createFn: Document['createElement'],
    senderUrl: string,
    opt: InternalTransportOptions,
): Promise<null> => {
    return new PolyPromise((resolve, reject) => {
        const root = getRootElement(ctx);
        const img = createFn('img');
        const rejectWithError = pipe(
            bindArg(img, removeNode),
            bindArg(createKnownError(opt.debugStack), reject),
        );
        const timeOut = setDeferBase(ctx, rejectWithError, opt.timeOut || 3000);

        img.onerror = rejectWithError;
        img.onload = pipe(
            bindArg(img, removeNode),
            bindArg(null, resolve),
            bindArgs([ctx, timeOut], clearDefer),
        );
        const query = mix({}, opt.rQuery);
        delete query[REQUEST_MODE_KEY];
        img.src = getSrcUrl(senderUrl, opt, query);
        if (isSafari(ctx)) {
            mix(img.style, {
                position: 'absolute',
                visibility: 'hidden',
                width: '0px',
                height: '0px',
            });
            root.appendChild(img);
        }
    });
};

const useImage: CheckTransport = (ctx: Window) => {
    const createFn = getElemCreateFunction(ctx);
    if (createFn) {
        const reqFnCreate = bindArgs([ctx, createFn], request);
        return reqFnCreate;
    }
    return false;
};

export { useImage };
