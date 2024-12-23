import { arrayMerge } from 'src/utils/array/merge';
import { bindArg } from 'src/utils/function/bind';
import { cFilter } from 'src/utils/array/filter';
import { cIndexOf } from 'src/utils/array/indexOf';
import { flatMap } from 'src/utils/array/map';
import { toArray } from 'src/utils/array/utils';
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
) => {
    if (!node || !node.querySelectorAll) {
        return [];
    }
    const result = node.querySelectorAll(selector);

    return result ? toArray<R>(result) : [];
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
    const copiedTags: string[] = arrayMerge([], tags);
    const tag = copiedTags.shift();
    if (!tag) {
        return [];
    }

    const elements = target.getElementsByTagName(tag);

    if (!copiedTags.length) {
        return toArray(elements);
    }

    return flatMap(
        bindArg(copiedTags, querySelectorByTagNamePolyfill),
        toArray(elements),
    );
};

// path - работает только для тэгов разделенных пробелами
export const querySelectorByTagName = (
    ctx: Window,
    path: string,
    target: Element | Document,
) => {
    if (isQuerySelectorSupported(ctx)) {
        return toArray(target.querySelectorAll(path));
    }

    const tags = path.split(' ');
    const all = querySelectorByTagNamePolyfill(tags, target);

    // Фильтр против дубликатов
    return cFilter((val, index) => {
        return cIndexOf(ctx)(val, all) === index;
    }, all);
};
