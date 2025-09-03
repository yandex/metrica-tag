import { cEvent } from '../events/events';
import { insertScript } from './insertScript';
import { globalMemoWin } from '../function/globalMemo';
import { constructObject } from '../function/construct';

export type InsertScriptStates = Record<string, InsertScriptState>;
export type InsertScriptState = {
    script: HTMLScriptElement | undefined;
    state: ScriptState;
};
export const INSERT_SCRIPT_GS_KEY = 'giss';

// eslint-disable-next-line no-shadow
export const enum ScriptState {
    Pending = 0,
    Loaded = 1,
    Error = 2,
}

const getInsertScriptState = globalMemoWin(
    INSERT_SCRIPT_GS_KEY,
    constructObject,
) as (ctx: Window) => InsertScriptStates;

// didn't simply use memo because it has side effects therefore it isn't deleted by rollup as the result of tree-shaking
// FIXME: find a way to make memo tree-shakable
const insertScriptOnce = (ctx: Window, src: string) => {
    const scriptState = getInsertScriptState(ctx);
    if (!scriptState[src]) {
        scriptState[src] = {
            script: insertScript(ctx, { src }),
            state: ScriptState.Pending,
        };
    }

    return scriptState[src];
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
