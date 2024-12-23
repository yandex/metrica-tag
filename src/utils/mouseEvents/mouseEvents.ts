import { getRootElement, getDocumentScroll } from '../dom/dom';

export type TMouseButton = 0 | 1 | 2 | 3 | 4;

export const getPosition = (ctx: Window, evt: MouseEvent) => {
    const rootElement = getRootElement(ctx);
    const documentScroll = getDocumentScroll(ctx);

    return {
        x:
            evt.pageX ||
            evt.clientX + documentScroll.x - (rootElement.clientLeft || 0) ||
            0,
        y:
            evt.pageY ||
            evt.clientY + documentScroll.y - (rootElement.clientTop || 0) ||
            0,
    };
};

export const getMouseButton = (event: MouseEvent & Event): TMouseButton => {
    const { which, button } = event;
    if (!which && button !== undefined) {
        if (button === 1 || button === 3) return 1;
        if (button === 2) return 3;
        if (button === 4) return 2;
        return 0;
    }
    return which as TMouseButton;
};

export const getTarget = (
    ctx: Window,
    evt: MouseEvent & Event,
): HTMLElement | null => {
    let target = null;
    try {
        target = (evt.target || evt.srcElement) as Document;

        if (target) {
            if (!target.ownerDocument && target.documentElement) {
                // На document попали, берём html
                target = target.documentElement;
            } else if (target.ownerDocument !== ctx.document) {
                // Чужой iframe
                target = null;
            }
        }
    } catch (e) {
        // empty
    }

    return target as HTMLElement;
};
