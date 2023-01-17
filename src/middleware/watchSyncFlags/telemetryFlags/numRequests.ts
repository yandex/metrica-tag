import { DEFER_KEY } from 'src/api/watch';
import type { SenderInfo } from 'src/sender/SenderInfo';
import { getCounterKey, CounterOptions } from 'src/utils/counterOptions';
import { call, memo, pipe } from 'src/utils/function';

const getNumRequestsIncrementor = memo((counterKey: string) => {
    let reqNum = 0;
    return () => {
        reqNum += 1;
        return reqNum;
    };
});

const runNumRequestsIncrementor = pipe(
    getCounterKey,
    getNumRequestsIncrementor,
    call,
);

export const numRequestsTelemetry = (
    ctx: Window,
    options: CounterOptions,
    senderParams: SenderInfo,
) => {
    const { urlParams } = senderParams;
    if (!urlParams || urlParams[DEFER_KEY]) {
        return null;
    }

    return runNumRequestsIncrementor(options);
};
