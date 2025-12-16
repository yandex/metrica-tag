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
    const isIFrameLoaded = (element: Window | HTMLIFrameElement) => {
        /**
         * window doesn't have a nodeType property
         */
        if (!(target as Node).nodeType) {
            return true;
        }
        /**
         * The iframe element has an URL of the resource
         * in the "src" attribute, which will be loaded.
         * If it is not set, the default value will be "about:blank"
         */
        const { src } = element as HTMLIFrameElement;
        /**
         * The actual URL of the loaded resource to the iframe element.
         */
        const factUrl = getPath(element, 'contentDocument.URL');
        /**
         * During loading of the resource from the "src" attribute,
         * the actual URL has the value "about:blank".
         * When those values become equal, the content of the iframe element
         * is considered fully loaded.
         */
        return src === factUrl;
    };
    const wait = (resolve: (a?: unknown) => void) => {
        if (getPath(target, pathToBody) && isIFrameLoaded(target)) {
            resolve();
        } else {
            setDefer(ctx, bindArg(resolve, wait), TIMEOUT_FOR_BODY);
        }
    };
    return task((_, resolve) => {
        wait(resolve);
    });
};
