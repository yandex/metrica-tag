import { cEvent } from '../events';
import { insertScript } from './insertScript';

// eslint-disable-next-line no-shadow
const enum ScriptState {
    Pending = 0,
    Loaded = 1,
    Error = 2,
}

const scriptsState: Record<
    string,
    {
        script: HTMLScriptElement | undefined;
        state: ScriptState;
    }
> = {};

// didn't simply use memo because it has side effects therefore it isn't deleted by rollup as the result of tree-shaking
// FIXME: find a way to make memo tree-shakable
const insertScriptOnce = (ctx: Window, src: string) => {
    if (!scriptsState[src]) {
        scriptsState[src] = {
            script: insertScript(ctx, { src }),
            state: ScriptState.Pending,
        };
    }

    return scriptsState[src];
};

/**
 * @description This function loads script only once. Warning - it doesn't work in ie8 and lower because it has no working api for onload events for scripts (onload/attachEvent not working).
 */
export const loadScript = (
    ctx: Window,
    src: string,
    onLoadCb: () => void,
    onErrorCb?: () => void,
) => {
    const scriptLoadState = insertScriptOnce(ctx, src);
    const { script, state } = scriptLoadState;
    const onError = () => {
        scriptLoadState.state = ScriptState.Error;
        if (onErrorCb) {
            onErrorCb();
        }
    };

    const onLoad = () => {
        scriptLoadState.state = ScriptState.Loaded;
        onLoadCb();
    };

    if (!script || state === ScriptState.Error) {
        onError();
        return;
    }

    if (state === ScriptState.Loaded) {
        onLoad();
        return;
    }

    const events = cEvent(ctx);
    events.on(script, ['load'], onLoad);
    events.on(script, ['error'], onError);
};
