import { getData, ID, NAME, PATH } from 'src/utils/dom/identifiers';
import { select } from 'src/utils/dom/select';
import { closest } from 'src/utils/dom/closest';
import { bindArg } from '../function';

const FORM_SELECTOR = 'form';

export const closestForm = bindArg(FORM_SELECTOR, closest);
export const selectForms = bindArg(FORM_SELECTOR, select);

export const getFormData = (
    ctx: Window,
    form: HTMLElement,
    ignored?: HTMLElement,
) => getData(ctx, form, [ID, NAME, PATH], undefined, ignored);
