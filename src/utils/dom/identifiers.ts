import { cReduce, cSome } from 'src/utils/array';
import { ctxPath, getPath } from 'src/utils/object';
import { getElementPathCached } from 'src/utils/dom/element';
import { convertToString } from 'src/utils/string';
import { trimText } from 'src/utils/string/remove';
import { isInputElement } from 'src/utils/dom/dom';
import { flags } from '@inject';
import {
    CLICK_TRACKING_FEATURE,
    LOCAL_FEATURE,
    PREPROD_FEATURE,
    REMOTE_CONTROL_FEATURE,
    SUBMIT_TRACKING_FEATURE,
} from 'generated/features';
import { equal, pipe } from 'src/utils/function';
import { fnv32a } from 'src/utils/fnv32a';
import type { Queryable } from './select';

export const ID = 'i';
export const NAME = 'n';
export const PATH = 'p';
export const CONTENT = 'c';
export const HREF = 'h';
export const TYPE = 'ty';

const IDENTIFIERS = [ID, NAME, HREF, PATH, CONTENT, TYPE] as const;

export type Identifier = typeof IDENTIFIERS[number];
type GenericGetter = (ctx: Window, element: HTMLElement) => string | null;
type ContentGetter = (
    ctx: Window,
    element: HTMLElement,
    selectFn?: (node: Queryable) => HTMLElement[],
) => string | null;
export type IdentifierGetter =
    | typeof getElementPathCached
    | ContentGetter
    | GenericGetter;

export const DEFAULT_SIZE_LIMIT = 100;
const SIZE_LIMITS: Record<string, number> = {};

const HASH: Partial<Record<Identifier, boolean>> = {};

if (
    flags[SUBMIT_TRACKING_FEATURE] ||
    flags[PREPROD_FEATURE] ||
    flags[LOCAL_FEATURE]
) {
    SIZE_LIMITS[PATH] = 500;
}

export const getAttribute = (element: HTMLElement, name: string) => {
    return element.getAttribute && element.getAttribute(name);
};

const ATTRIBUTES_MAP: Partial<Record<Identifier, string>> = {};

if (flags[SUBMIT_TRACKING_FEATURE] || flags[REMOTE_CONTROL_FEATURE]) {
    ATTRIBUTES_MAP[ID] = 'id';
    ATTRIBUTES_MAP[NAME] = 'name';
}

if (flags[CLICK_TRACKING_FEATURE] || flags[REMOTE_CONTROL_FEATURE]) {
    ATTRIBUTES_MAP[HREF] = 'href';
    ATTRIBUTES_MAP[TYPE] = 'type';

    HASH[HREF] = true;
    HASH[CONTENT] = true;
}

export const GETTERS_MAP: Partial<
    {
        p: typeof getElementPathCached;
        c: ContentGetter;
    } & Record<Exclude<Identifier, typeof PATH | typeof CONTENT>, GenericGetter>
> = {};

if (
    flags[SUBMIT_TRACKING_FEATURE] ||
    flags[CLICK_TRACKING_FEATURE] ||
    flags[REMOTE_CONTROL_FEATURE]
) {
    GETTERS_MAP[PATH] = getElementPathCached;
}

if (flags[CLICK_TRACKING_FEATURE] || flags[REMOTE_CONTROL_FEATURE]) {
    GETTERS_MAP[CONTENT] = (ctx, element, selectFn) => {
        let result = trimText(getPath(element, 'textContent'));
        if (result && selectFn) {
            const childButtons = selectFn(element);
            if (
                childButtons.length &&
                cSome(
                    pipe(ctxPath('textContent'), trimText, equal(result)),
                    childButtons,
                )
            ) {
                result = '';
            }
        }

        if (isInputElement(element)) {
            result = trimText(getAttribute(element, 'value') || result);
        }
        return result;
    };
}

export const getData = (
    ctx: Window,
    element: HTMLElement,
    ids: Identifier[],
    selectFn?: (node: Queryable) => HTMLElement[],
    ignored?: HTMLElement,
) => {
    return cReduce(
        (acc, idKey) => {
            let value: string | null = null;
            if (idKey in ATTRIBUTES_MAP) {
                value = getAttribute(element, ATTRIBUTES_MAP[idKey]!);
            } else if (idKey in GETTERS_MAP) {
                if (idKey === PATH) {
                    value = GETTERS_MAP[idKey]!(ctx, element, ignored);
                } else if (idKey === CONTENT) {
                    value = GETTERS_MAP[idKey]!(ctx, element, selectFn);
                } else {
                    value = GETTERS_MAP[idKey]!(ctx, element);
                }
            }

            if (value) {
                const slicedValue = value.slice(
                    0,
                    SIZE_LIMITS[idKey] || DEFAULT_SIZE_LIMIT,
                );
                acc[idKey] = HASH[idKey]
                    ? convertToString(fnv32a(slicedValue))
                    : slicedValue;
            }

            return acc;
        },
        {} as Record<Identifier, string | null>,
        ids,
    );
};
