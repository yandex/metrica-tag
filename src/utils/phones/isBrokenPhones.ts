import { isBrokenFromCharCode } from '../browser/browser';
import { isQuerySelectorSupported } from '../dom/queySelect';
import { memo } from '../function/memo';

export const isBrokenPhones = memo((ctx: Window) => {
    return isBrokenFromCharCode(ctx) || !isQuerySelectorSupported(ctx);
});
