import { isNativeFunction } from 'src/utils/function/isNativeFunction/isNativeFunction';

export const replaceState = (
    ctx: Window,
    url: string,
    stateObj?: Record<string, string>,
) => {
    if (
        ctx?.history?.replaceState &&
        isNativeFunction('replaceState', ctx.history.replaceState)
    ) {
        ctx.history.replaceState(stateObj, '', url);
    }
};
