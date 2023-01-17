import { ctxErrorLogger } from 'src/utils/errorLogger';
import { CounterOptions } from 'src/utils/counterOptions';
import { CounterSettings, getCounterSettings } from 'src/utils/counterSettings';
import { getPath } from 'src/utils/object';
import { hidePhones } from 'src/utils/phones/phonesHide';
import { isMobile } from 'src/utils/browser';
import { cookieStorage } from 'src/storage/cookie';
import { parse } from 'src/utils/json';
import { isBrokenPhones } from 'src/utils/phones/isBrokenPhones';

const PHONE_HIDE_TEST_COOKIE_NAME = 'yaHidePhones';

/**
 * Hide part of the phone number and show it when clicked or hovered
 * to calculate what percentage of visitors were interested in the phone number
 * @param ctx - Current window
 * @param counterOpt - Counter options during initialization
 */
export const usePhoneHideProvider = ctxErrorLogger(
    'phc.h',
    (ctx: Window, counterOpt: CounterOptions) => {
        if (isMobile(ctx) || isBrokenPhones(ctx)) {
            return null;
        }

        return getCounterSettings(counterOpt, (settings: CounterSettings) => {
            const phoneChangerSettings = getPath(settings, 'settings.phchange');
            if (!phoneChangerSettings) {
                const cookie = cookieStorage(ctx, '');

                const cookieValue = cookie.getVal(PHONE_HIDE_TEST_COOKIE_NAME);
                const testValue = cookieValue
                    ? (parse(ctx, cookieValue) as string[])
                    : '';

                const phoneHideSettings =
                    getPath(settings, 'settings.phhide') || testValue;

                if (phoneHideSettings) {
                    hidePhones(ctx, counterOpt, phoneHideSettings);
                }
            }
        }) as Promise<void>;
    },
);
