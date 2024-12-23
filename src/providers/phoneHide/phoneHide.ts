import { ctxErrorLogger, errorLogger } from 'src/utils/errorLogger/errorLogger';
import { CounterOptions } from 'src/utils/counterOptions';
import { getCounterSettings } from 'src/utils/counterSettings/counterSettings';
import { getPath } from 'src/utils/object';
import { hidePhones } from 'src/utils/phones/phonesHide';
import { isMobile } from 'src/utils/browser/browser';
import { isBrokenPhones } from 'src/utils/phones/isBrokenPhones';
import { getLocation } from 'src/utils/location/location';
import { stringIncludes } from 'src/utils/string';
import { globalLocalStorage } from 'src/storage/localStorage/localStorage';
import { CounterSettings } from 'src/utils/counterSettings/types';
import { COUNTER_SETTINGS_SETTINGS_KEY } from 'src/utils/counterSettings/const';
import { COUNTER_SETTINGS_HIDE_PHONES_KEY } from './const';

const FORCE_HIDE_PHONES_KEY = 'hide_phones';

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
                    `_ym_${FORCE_HIDE_PHONES_KEY}=1`,
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
