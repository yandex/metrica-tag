import { DEFER_KEY } from 'src/api/watch';
import type { SenderInfo } from 'src/sender/SenderInfo';
import { counterLocalStorage } from 'src/storage/localStorage/localStorage';
import { CounterOptions, getCounterKey } from 'src/utils/counterOptions';
import { REQUEST_NUMBER_KEY } from '../const';

export const numRequests = (
    ctx: Window,
    options: CounterOptions,
    senderParams: SenderInfo,
) => {
    const { urlParams } = senderParams;
    if (!urlParams || urlParams[DEFER_KEY]) {
        return null;
    }

    const counterKey = getCounterKey(options);
    const ls = counterLocalStorage(ctx, counterKey);
    const lsKey = REQUEST_NUMBER_KEY;
    const reqNum = ls.getVal(lsKey, 0) || 0;

    const nextReq = reqNum + 1;
    ls.setVal(lsKey, nextReq);

    if (ls.getVal(lsKey) === nextReq) {
        return nextReq;
    }
    ls.delVal(lsKey);
    if (reqNum > 1) {
        return null;
    }

    return null;
};
