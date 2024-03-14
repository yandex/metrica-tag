import { TITLE_BR_KEY } from 'src/api/watch';
import { entries } from 'src/utils/object';
import { cIndexOfWin, arrayJoin, dirtyReduce } from 'src/utils/array';
import {
    flagStorage,
    FlagStorage,
    FlagData,
} from '../flagsStorage/flagsStorage';

export const BR_INFO_DELIMITER = ':';

export const setInSerialized = (
    str: string,
    flag: string,
    val: string | number,
): string => {
    const deserialized: Array<string | number> = str.split(BR_INFO_DELIMITER);
    const key = cIndexOfWin(flag, deserialized);
    const valueKey = key + 1;

    if (key === -1) {
        return str;
    }

    deserialized[valueKey] = val;

    return arrayJoin(BR_INFO_DELIMITER, deserialized);
};

export const browserInfo = flagStorage((flags: FlagData) => {
    // title should always be last
    let titleComponent = '';
    const result = dirtyReduce(
        (carry, [key, value]) => {
            const brinfoComponent = `${key}${BR_INFO_DELIMITER}${value}`;
            if (key === TITLE_BR_KEY) {
                titleComponent = brinfoComponent;
            } else {
                carry.push(brinfoComponent);
            }

            return carry;
        },
        [] as string[],
        entries(flags),
    );
    if (titleComponent) {
        result.push(titleComponent);
    }

    return arrayJoin(BR_INFO_DELIMITER, result);
});

export type BrowserInfo = FlagStorage;
