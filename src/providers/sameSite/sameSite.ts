import { memo } from 'src/utils/function';
import { isSameSiteBrowser } from 'src/utils/browser';
import { isHttps } from 'src/utils/location';

/**
 * Decides if we need to set same site option
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite
 * @param ctx - Current window
 */
export const getSameSiteCookieInfo = memo((ctx: Window): string => {
    if (isSameSiteBrowser(ctx) && isHttps(ctx)) {
        return 'SameSite=None;Secure;';
    }
    return '';
});
