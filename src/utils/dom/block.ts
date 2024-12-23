import { bindArg } from '../function/bind';
import { closest } from './closest';
import { CSS, PATH, getData } from './identifiers';
import { select } from './select';

const BLOCK_SELECTOR =
    'div,span,main,section,p,b,h1,h2,h3,h4,h5,h6,td,small,a,i,td,li,q';

export const getClosestTextContainer = bindArg(BLOCK_SELECTOR, closest);
export const selectTextContainer = bindArg(BLOCK_SELECTOR, select);
export const getTextContainerData = (
    ctx: Window,
    form: HTMLElement,
    ignored?: HTMLElement,
) => getData(ctx, form, [PATH, CSS], undefined, ignored);
