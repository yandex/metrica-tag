import { setDefer } from 'src/utils/defer/defer';
import { getPath } from 'src/utils/object';
import { task } from '../async/task';
import { bindArg } from '../function/bind';

export const TIMEOUT_FOR_BODY = 100;
export const waitForBodyTask = (
    ctx: Window,
    target: Window | HTMLIFrameElement = ctx,
) => {
    const pathToBody = `${
        (target as Node).nodeType ? 'contentWindow.' : ''
    }document.body`;
    const wait = (resolve: (a?: unknown) => void) => {
        if (getPath(target, pathToBody)) {
            resolve();
        } else {
            setDefer(ctx, bindArg(resolve, wait), TIMEOUT_FOR_BODY);
        }
    };
    return task((_, resolve) => {
        wait(resolve);
    });
};
