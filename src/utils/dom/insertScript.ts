import { getElemCreateFunction } from './dom';

export type ScriptOptions = {
    src: string;
    type?: string;
    charset?: string;
    async?: boolean;
};

export const insertScript = (
    ctx: Window,
    options: ScriptOptions,
): HTMLScriptElement | undefined => {
    const createFn = getElemCreateFunction(ctx);
    if (!createFn) {
        return undefined;
    }
    const { document: doc } = ctx;
    const scriptTag = createFn('script');
    scriptTag.src = options.src;
    scriptTag.type = options.type || 'text/javascript';
    scriptTag.charset = options.charset || 'utf-8';
    scriptTag.async = options.async || true;
    try {
        let head = doc.getElementsByTagName('head')[0];
        // fix for Opera
        if (!head) {
            const html = doc.getElementsByTagName('html')[0];
            head = createFn('head');
            if (html) {
                html.appendChild(head);
            }
        }
        head.insertBefore(scriptTag, head.firstChild);
        return scriptTag;
    } catch (e) {
        // empty
    }
    return undefined;
};
