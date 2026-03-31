import { isNativeFunction } from 'src/utils/function/isNativeFunction/isNativeFunction';
import { toArray } from 'src/utils/array/utils';
import { PolySet } from 'src/utils/set';
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
        // Using without toArray is prohibited due to absence of symbol.iterator in NodeList in old browsers (e.g. IE11)
        const matches = new PolySet(
            toArray(
                (ctx.document || (ctx as any).ownerDocument).querySelectorAll(
                    selector,
                ),
            ),
        );
        let cursor = el;

        while (cursor && cursor.nodeType === 1 && !matches.has(cursor)) {
            cursor = cursor.parentElement || (cursor.parentNode as HTMLElement);
        }

        if (!cursor || cursor.nodeType !== 1) {
            return null;
        }

        return cursor;
    }

    return null;
};
