import { entries, isNull } from 'src/utils/object';

import { flagStorage, FlagStorage } from '../flagsStorage/flagsStorage';
import { arrayJoin, cMap } from '../array';

export const telemetry = flagStorage((flags) => {
    const flagEntries = entries(flags);
    return arrayJoin(
        '',
        cMap(([name, value]: [string, string | number | null]) => {
            if (!isNull(value)) {
                return `${name}(${value})`;
            }

            return '';
        }, flagEntries),
    );
});

export type Telemetry = FlagStorage;

export const addTelemetryToSenderParams = (
    senderParams: { telemetry?: Telemetry },
    key?: string,
    value: string | number | null = null,
) => {
    if (!senderParams.telemetry) {
        senderParams.telemetry = telemetry();
    }
    if (key) {
        senderParams.telemetry.setOrNot(key, value);
    }

    return senderParams.telemetry;
};
