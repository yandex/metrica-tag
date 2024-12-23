import { WATCH_URL_PARAM, WATCH_REFERER_PARAM } from 'src/api/watch';
import type { SenderInfo } from 'src/sender/SenderInfo';
import { getLocation } from 'src/utils/location/location';
import { getPath } from 'src/utils/object';
import { CounterOptions } from 'src/utils/counterOptions';

const replaceRegex = /\/$/;

export const isFalseURL = (
    ctx: Window,
    opt: CounterOptions,
    senderParams: SenderInfo,
) => {
    const { urlParams } = senderParams;
    if (!urlParams) {
        return null;
    }
    const trueRef = (getPath(ctx, 'document.referrer') || '').replace(
        replaceRegex,
        '',
    );
    const senderRef = (urlParams[WATCH_REFERER_PARAM] || '').replace(
        replaceRegex,
        '',
    );
    const senderUrl = urlParams[WATCH_URL_PARAM];
    const trueUrl = getLocation(ctx);
    const isFalseUrlBool = trueUrl.href !== senderUrl;
    const isFalseRefBool = trueRef !== senderRef;
    let result = 0;

    if (isFalseUrlBool && isFalseRefBool) {
        result = 3;
    } else if (isFalseRefBool) {
        result = 1;
    } else if (isFalseUrlBool) {
        result = 2;
    }
    return result;
};
