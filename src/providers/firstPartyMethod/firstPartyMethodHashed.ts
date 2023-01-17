import { cReduce } from 'src/utils/array';
import { getCounterInstance } from 'src/utils/counter';
import { CounterOptions } from 'src/utils/counterOptions';
import { cKeys, entries, isObject, len } from 'src/utils/object';
import { isString } from 'src/utils/string';
import { getLoggerFn } from '../debugConsole/debugConsole';
import { METHOD_NAME_PARAMS } from '../params/const';
import { FirstPartyInputData, FirstPartyOutputData } from './const';

const LOGGER_PREFIX = 'First party params error.';

export const encodeRecursiveHashed = (
    obj: FirstPartyInputData,
): FirstPartyOutputData[] => {
    const entry = entries(obj);
    return cReduce<
        [string, string | FirstPartyInputData],
        FirstPartyOutputData[]
    >(
        (accum, [key, val]) => {
            const valIsObject = isObject(val);
            if (!isString(val) && !valIsObject) {
                return accum;
            }

            const result: string | FirstPartyOutputData[] = valIsObject
                ? encodeRecursiveHashed(val as FirstPartyInputData)
                : (val as string);
            if (len(result)) {
                accum.push([key, result]);
            }
            return accum;
        },
        [],
        entry,
    );
};

/**
 * Sends contact information of site users in hashed and depersonalized form. Site owners do hashing by themselves
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 */
export const useFirstPartyMethodHashed =
    (ctx: Window, counterOptions: CounterOptions) =>
    (data: FirstPartyInputData): void => {
        const counter = getCounterInstance(ctx, counterOptions);
        if (!counter) {
            return;
        }

        if (!isObject(data)) {
            getLoggerFn(
                ctx,
                counterOptions,
                `${LOGGER_PREFIX} Not an object.`,
            )();
            return;
        }
        if (!len(cKeys(data))) {
            getLoggerFn(
                ctx,
                counterOptions,
                `${LOGGER_PREFIX} Empty object.`,
            )();
            return;
        }

        const result = encodeRecursiveHashed(data);
        if (result && len(result)) {
            counter[METHOD_NAME_PARAMS]!({
                ['__ym']: {
                    [`fpmh`]: result,
                },
            });
        }
    };
