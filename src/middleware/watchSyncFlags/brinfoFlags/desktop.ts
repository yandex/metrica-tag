import { IS_DESKTOP_BR_KEY } from 'src/api/watch';
import { getGlobalStorage } from 'src/storage/global/getGlobal';
import { toZeroOrOne } from 'src/utils/boolean';
import { errorLogger } from 'src/utils/errorLogger/errorLogger';
import { getPath, isUndefined } from 'src/utils/object';
import { BRINFO_LOGGER_PREFIX } from '../const';

const BATTERY_INFO = 'bt';

export type BatteryManager = {
    chargingTime: number;
    charging: boolean;
};

declare global {
    interface Navigator {
        getBattery?: () => Promise<BatteryManager>;
    }
}

export const getDesktopFlag = (ctx: Window) => {
    const globalConfig = getGlobalStorage(ctx);
    const batteryInfo: {
        v?: boolean;
        p?: Promise<BatteryManager> | null;
    } = globalConfig.getVal(BATTERY_INFO, {});
    if (isUndefined(globalConfig.getVal(BATTERY_INFO))) {
        const getBattery = getPath(ctx, 'navigator.getBattery');

        // getBattery() not available in privacy proxy mode
        try {
            batteryInfo.p = getBattery && getBattery.call(ctx.navigator);
        } catch (e) {}

        globalConfig.setVal(BATTERY_INFO, batteryInfo);
        if (batteryInfo.p && batteryInfo.p.then) {
            batteryInfo.p.then(
                errorLogger(
                    ctx,
                    `${BRINFO_LOGGER_PREFIX}:${IS_DESKTOP_BR_KEY}.p`,
                    (battery: BatteryManager) => {
                        batteryInfo.v =
                            getPath(battery, 'charging')! &&
                            getPath(battery, 'chargingTime') === 0;
                    },
                ),
            );
        }
    }
    return toZeroOrOne(batteryInfo.v);
};
