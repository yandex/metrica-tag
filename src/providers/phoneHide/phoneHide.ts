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
import { COUNTER_SETTINGS_HIDE_PHONES_KEY } from './const';

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

            const phoneHideSettings: string[] | undefined = getPath(
                settings,
                `${COUNTER_SETTINGS_SETTINGS_KEY}.${COUNTER_SETTINGS_HIDE_PHONES_KEY}`,
            );

            if (phoneHideSettings) {
                hidePhones(ctx, counterOpt, phoneHideSettings);
            }
        }).catch(errorLogger(ctx, 'phc.hs'));
    },
);
