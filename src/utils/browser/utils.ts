import { ctxPath, getPath } from 'src/utils/object/path';
import { memo } from 'src/utils/function/memo';
import { stringIndexOf } from '../string';

export const getAppleUAProps = memo((ctx: Window) => {
    const navigator = getPath(ctx, 'navigator') || {};
    const userAgentInfo = getPath(navigator, 'userAgent') || '';
    const vendor = getPath(navigator, 'vendor') || '';
    const isApple = stringIndexOf(vendor, 'Apple') > -1;
    return { isApple, userAgentInfo };
});

export const checkUserAgent = (str: RegExp, ctx: Window) => {
    return (
        (getPath(ctx, 'navigator.userAgent') || '')
            .toLowerCase()
            .search(str) !== -1
    );
};

export const getAgent = memo(ctxPath('navigator.userAgent'));
