import { flatMap, cFilter, cIndexOf, arrayFrom } from 'src/utils/array';
import { bindArg } from 'src/utils/function';
import { isQuerySelectorSupported } from './queySelect';

export type Queryable = {
    querySelectorAll: ParentNode['querySelectorAll'];
    querySelector: ParentNode['querySelector'];
};

export const select = <
    T extends Queryable = Element,
    R extends Element = T extends Element ? T : Element,
>(
    selector: string,
    node: T,
): R[] => {
    if (!node) {
        return [];
    }
    const result = node.querySelectorAll<R>(selector);

    return result ? arrayFrom(result) : [];
};

export const selectOne = <
    T extends Queryable = Element,
    R extends Element = T extends Element ? T : Element,
>(
    selector: string,
    node: T,
): R | null => {
    if (node.querySelector) {
        return node.querySelector<R>(selector);
    }

    const result = select<T, R>(selector, node);
    return result && result.length ? result[0] : null;
};

export const querySelectorByTagNamePolyfill = (
    tags: string[],
    target: Element | Document,
): Element[] => {
    const copiedTags = [...tags];
    const tag = copiedTags.shift();
    if (!tag) {
        return [];
    }

    const elements = target.getElementsByTagName(tag);

    if (!copiedTags.length) {
        return arrayFrom(elements);
    }

    return flatMap(
        bindArg(copiedTags, querySelectorByTagNamePolyfill),
        arrayFrom(elements),
    );
};

/**
 * @param path - Works only with tag names split by space.
 */
export const querySelectorByTagName = (
    ctx: Window,
    path: string,
    target: Element | Document,
) => {
    if (isQuerySelectorSupported(ctx)) {
        return arrayFrom(target.querySelectorAll(path));
    }

    const tags = path.split(' ');
    const all = querySelectorByTagNamePolyfill(tags, target);

    // Filter off duplicates
    return cFilter((val, index) => {
        return cIndexOf(ctx)(val, all) === index;
    }, all);
};
