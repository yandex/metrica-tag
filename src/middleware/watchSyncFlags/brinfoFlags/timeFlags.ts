import { cont } from 'src/utils/function/curry';
import { memo } from 'src/utils/function/memo';
import { pipe } from 'src/utils/function/pipe';
import {
    TimeOne,
    getTimezone,
    getTimestamp,
    getSec,
    getNs,
    TimeState,
} from 'src/utils/time/time';

export const timeZone = memo(
    pipe(TimeOne, cont<(timeState: TimeState) => number, number>(getTimezone)),
);
export const timeStamp = pipe(
    TimeOne,
    cont<(timeState: TimeState) => string, string>(getTimestamp),
);
export const timeSeconds = pipe(
    TimeOne,
    cont<(timeState: TimeState) => number, number>(getSec),
);
export const timeNavigationStart = memo(
    pipe(TimeOne, cont<(timeState: TimeState) => number, number>(getNs)),
);
