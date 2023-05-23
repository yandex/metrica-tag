import { closest } from 'src/utils/dom/closest';
import { Queryable, select } from 'src/utils/dom/select';
import { cMap, filterFalsy } from 'src/utils/array';
import {
    CONTENT,
    getData,
    HREF,
    ID,
    Identifier,
    PATH,
    TYPE,
} from 'src/utils/dom/identifiers';
import { getNodeName } from 'src/utils/dom/dom';
import { bindArg } from '../function';

export const BUTTON_SELECTOR = `button,${cMap(
    (type) => `input[type="${type}"]`,
    ['button', 'submit', 'reset', 'file'],
).join(',')},a`;

export const MAYBE_BUTTON_SELECTOR = 'div';

export const closestButton = (ctx: Window, node: HTMLElement) => {
    let button = closest(BUTTON_SELECTOR, ctx, node) as HTMLElement | null;
    if (!button) {
        const maybeButton = closest(
            MAYBE_BUTTON_SELECTOR,
            ctx,
            node,
        ) as HTMLElement | null;
        if (maybeButton) {
            const childMaybe = select(
                `${BUTTON_SELECTOR},${MAYBE_BUTTON_SELECTOR}`,
                maybeButton,
            );
            if (!childMaybe.length) {
                button = maybeButton;
            }
        }
    }

    return button;
};

export const selectButtons = bindArg(
    BUTTON_SELECTOR,
    select as (selector: string, node: Queryable) => HTMLElement[],
);

const TAG_DATA: Record<string, Identifier> = {
    ['A']: HREF,
    ['BUTTON']: ID,
    ['DIV']: ID,
    ['INPUT']: TYPE,
};

export const getButtonData = (
    ctx: Window,
    button: HTMLElement | null,
    ignored?: HTMLElement,
) => {
    const nodeName = getNodeName(button);

    return (
        nodeName &&
        getData(
            ctx,
            button!,
            filterFalsy([PATH, TAG_DATA[nodeName], CONTENT]),
            selectButtons,
            ignored,
        )
    );
};
