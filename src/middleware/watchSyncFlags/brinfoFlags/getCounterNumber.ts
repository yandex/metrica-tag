import { getGlobalStorage } from 'src/storage/global';
import { getCounterKey } from 'src/utils/counterOptions';
import { memo, pipe, secondArg } from 'src/utils/function';

export const COUNTER_NO = 'counterNum';
export const getCounterNumber = memo((ctx: Window) => {
    const name = COUNTER_NO;
    const storage = getGlobalStorage(ctx);
    const privCn = storage.getVal<number>(name, 0);
    const newCn = privCn + 1;
    storage.setVal(name, newCn);
    return newCn;
}, pipe(secondArg, getCounterKey));
