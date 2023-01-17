import { mix, entries } from '../object';
import { getElemCreateFunction } from './dom';
import { dirtyPipe, getNativeFunction } from '../function';
import { ctxMap } from '../array';

export type ScriptOptions = {
    src: string;
    type?: string;
    charset?: string;
    async?: boolean;
};

export const loadScript = (
    ctx: Window,
    options: ScriptOptions,
): HTMLScriptElement | undefined => {
    const { document: doc } = ctx;
    const newOpt = mix(
        {
            type: 'text/javascript',
            charset: 'utf-8',
            async: true,
        },
        options,
    );
    const createFn = getElemCreateFunction(ctx);
    if (!createFn) {
        return undefined;
    }
    const scriptTag = createFn('script') as any;
    dirtyPipe(
        entries,
        ctxMap(([key, val]: [keyof ScriptOptions, string]) => {
            if (key === 'async' && val) {
                scriptTag.async = true;
            } else {
                scriptTag[key] = val;
            }
        }),
    )(newOpt);
    try {
        const getElems = getNativeFunction('getElementsByTagName', doc);
        let head = getElems('head')[0];
        // fix for Opera
        if (!head) {
            const html = getElems('html')[0];
            head = createFn('head');
            if (html) {
                html.appendChild(head);
            }
        }
        head.insertBefore(scriptTag, head.firstChild);
        return scriptTag as HTMLScriptElement;
    } catch (e) {
        // empty
    }
    return undefined;
};
