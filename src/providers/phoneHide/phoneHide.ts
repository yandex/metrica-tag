import { ctxErrorLogger, errorLogger } from 'src/utils/errorLogger';
import { CounterOptions } from 'src/utils/counterOptions';
import {
    CounterSettings,
    COUNTER_SETTINGS_SETTINGS_KEY,
    getCounterSettings,
} from 'src/utils/counterSettings';
import { getPath } from 'src/utils/object';
import { hidePhones } from 'src/utils/phones/phonesHide';
import { isMobile } from 'src/utils/browser';
import { isBrokenPhones } from 'src/utils/phones/isBrokenPhones';
import { getLocation } from 'src/utils/location';
import { stringIncludes } from 'src/utils/string';
import { globalLocalStorage } from 'src/storage/localStorage';
import { COUNTER_SETTINGS_HIDE_PHONES_KEY } from './const';

const FORCE_HIDE_PHONES_KEY = '_ym_hide_phones';

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
            return undefined;
        }

        return getCounterSettings(counterOpt, (settings: CounterSettings) => {
            const phoneChangerSettings = getPath(
                settings,
                `${COUNTER_SETTINGS_SETTINGS_KEY}.phchange`,
            );
            if (phoneChangerSettings) {
                return;
            }

            const ls = globalLocalStorage(ctx);
            const isForcedPhoneHide =
                stringIncludes(
                    getLocation(ctx).search,
                    `${FORCE_HIDE_PHONES_KEY}=1`,
                ) || ls.getVal(FORCE_HIDE_PHONES_KEY, 0);
            let phoneHideSettings = getPath(
                settings,
                `${COUNTER_SETTINGS_SETTINGS_KEY}.${COUNTER_SETTINGS_HIDE_PHONES_KEY}` as const,
            );
            if (isForcedPhoneHide && !phoneHideSettings) {
                phoneHideSettings = ['*'];
                ls.setVal(FORCE_HIDE_PHONES_KEY, 1);
            }

            if (phoneHideSettings) {
                hidePhones(ctx, counterOpt, phoneHideSettings);
            }
        }).catch(errorLogger(ctx, 'phc.hs'));
    },
);
