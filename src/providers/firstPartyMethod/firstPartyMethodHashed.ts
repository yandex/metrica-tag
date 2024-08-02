import { DebugConsole } from 'src/providers/debugConsole/debugConsole';
import {
    INTERNAL_PARAMS_KEY,
    METHOD_NAME_PARAMS,
} from 'src/providers/params/const';
import { cReduce } from 'src/utils/array';
import { getCounterInstance } from 'src/utils/counter';
import { CounterOptions, getCounterKey } from 'src/utils/counterOptions';
import { cKeys, entries, isObject, len } from 'src/utils/object';
import { isString } from 'src/utils/string';
import { isNumber } from 'src/utils/number';
import { FIRST_PARTY_HASHED_PARAMS_KEY } from './const';
import type { FirstPartyInputData, FirstPartyOutputData } from './types';
import {
    FIRST_PARTY_EMPTY_CONSOLE_MESSAGE,
    FIRST_PARTY_NOT_AN_OBJECT_CONSOLE_MESSAGE,
} from '../consoleRenderer/dictionary';

export const encodeRecursiveHashed = (
    ctx: Window,
    obj: FirstPartyInputData,
): FirstPartyOutputData[] =>
    cReduce<
        [string, string | number | FirstPartyInputData],
        FirstPartyOutputData[]
    >(
        (accum, [key, value]) => {
            let val = value;
            const valIsObject = isObject(value);

            if (!valIsObject) {
                if (isNumber(ctx, val)) {
                    val = `${val}`;
                }
                if (!isString(val)) {
                    return accum;
                }
            }

            const result: string | FirstPartyOutputData[] = valIsObject
                ? encodeRecursiveHashed(ctx, val as FirstPartyInputData)
                : (val as string);
            if (len(result)) {
                accum.push([key, result]);
            }
            return accum;
        },
        [],
        entries(obj),
    );

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
        const debugConsole = DebugConsole(ctx, getCounterKey(counterOptions));

        if (!isObject(data)) {
            debugConsole.log(FIRST_PARTY_NOT_AN_OBJECT_CONSOLE_MESSAGE);
            return;
        }
        if (!len(cKeys(data))) {
            debugConsole.log(FIRST_PARTY_EMPTY_CONSOLE_MESSAGE);
            return;
        }

        const result = encodeRecursiveHashed(ctx, data);
        if (!result || !len(result)) {
            return;
        }
        counter[METHOD_NAME_PARAMS]!({
            [INTERNAL_PARAMS_KEY]: {
                [FIRST_PARTY_HASHED_PARAMS_KEY]: result,
            },
        });
    };
