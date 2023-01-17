import { isNativeFunction } from '../function/isNativeFunction/isNativeFunction';
import { getPath } from '../object/path';

export const isQuerySelectorSupported = (ctx: Window) =>
    !!(
        isNativeFunction(
            'querySelectorAll',
            getPath(ctx, 'Element.prototype.querySelectorAll'),
        ) && ctx.document.querySelectorAll
    );
