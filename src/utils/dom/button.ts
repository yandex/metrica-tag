import { closest } from 'src/utils/dom/closest';
import { Queryable, select } from 'src/utils/dom/select';
import { filterFalsy } from 'src/utils/array/filter';
import { arrayJoin } from 'src/utils/array/join';
import { cMap } from 'src/utils/array/map';
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
import { bindArg } from '../function/bind';

export const BUTTON_SELECTOR = `button,${arrayJoin(
    ',',
    cMap(
        (type) => `input[type="${type}"]`,
        ['button', 'submit', 'reset', 'file'],
    ),
)},a`;

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
