import { getGlobalStorage } from 'src/storage/global/getGlobal';
import { getRandom } from 'src/utils/number/random';

export const HID_NAME = 'hitId';
export const getHid = (ctx: Window) => {
    const storage = getGlobalStorage(ctx);
    let val = storage.getVal<number>(HID_NAME);
    if (!val) {
        val = getRandom(ctx);
        storage.setVal<number>(HID_NAME, val);
    }

    return val;
};
