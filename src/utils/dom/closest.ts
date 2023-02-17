import { isNativeFunction } from 'src/utils/function';
import { arrayFrom, cIndexOf } from 'src/utils/array';
import { getMatchesFunction } from './dom';
import { isQuerySelectorSupported } from './queySelect';

export const closest = (selector: string, ctx: Window, el: HTMLElement) => {
    if (!(ctx && ctx.Element && ctx.Element.prototype && ctx.document) || !el) {
        return null;
    }

    if (
        ctx.Element.prototype.closest &&
        isNativeFunction('closest', ctx.Element.prototype.closest) &&
        el.closest
    ) {
        return el.closest(selector);
    }

    const matchesFunction = getMatchesFunction(ctx);
    if (matchesFunction) {
        let cursor = el;

        while (
            cursor &&
            cursor.nodeType === 1 &&
            !matchesFunction.call(cursor, selector)
        ) {
            cursor = cursor.parentElement || (cursor.parentNode as HTMLElement);
        }

        if (!cursor || cursor.nodeType !== 1) {
            return null;
        }

        return cursor;
    }
    if (isQuerySelectorSupported(ctx)) {
        const matches = arrayFrom(
            (ctx.document || (ctx as any).ownerDocument).querySelectorAll(
                selector,
            ),
        );
        let cursor = el;

        while (
            cursor &&
            cursor.nodeType === 1 &&
            cIndexOf(ctx)(cursor, matches) === -1
        ) {
            cursor = cursor.parentElement || (cursor.parentNode as HTMLElement);
        }

        if (!cursor || cursor.nodeType !== 1) {
            return null;
        }

        return cursor;
    }

    return null;
};
