import { isBrokenFromCharCode } from '../browser';
import { isQuerySelectorSupported } from '../dom';
import { memo } from '../function';

export const isBrokenPhones = memo((ctx: Window) => {
    return isBrokenFromCharCode(ctx) || !isQuerySelectorSupported(ctx);
});
