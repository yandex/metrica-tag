import { getGlobalStorage } from 'src/storage/global/getGlobal';
import { getCounterKey } from 'src/utils/counterOptions';
import { memo } from 'src/utils/function/memo';
import { secondArg } from 'src/utils/function/identity';
import { pipe } from 'src/utils/function/pipe';

export const COUNTER_NO = 'counterNum';
export const getCounterNumber = memo((ctx: Window) => {
    const name = COUNTER_NO;
    const storage = getGlobalStorage(ctx);
    const privCn = storage.getVal<number>(name, 0);
    const newCn = privCn + 1;
    storage.setVal(name, newCn);
    return newCn;
}, pipe(secondArg, getCounterKey));
