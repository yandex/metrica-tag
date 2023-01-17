import { getCounterInstance } from 'src/utils/counter';
import { CounterOptions } from 'src/utils/counterOptions';
import { METHOD_NAME_CLICK_MAP } from 'src/providers/clickmapMethod/const';
import { bindArg, bindArgs, cont, firstArg, pipe } from 'src/utils/function';
import { METHOD_NAME_TRACK_LINKS } from 'src/providers/clicks/const';
import { cFilter, cMap } from 'src/utils/array';
import {
    EnableAllHandler,
    METHOD_NAME_ENABLE_ALL,
} from 'src/providers/enableAll/const';
import { ctxErrorLogger } from 'src/utils/errorLogger';
import { getPath } from 'src/utils/object';
import { METHOD_NAME_ACCURATE_TRACK_BOUNCE } from 'src/providers/notBounce/const';

type ProviderResult = {
    [METHOD_NAME_ENABLE_ALL]: EnableAllHandler;
};

/**
 * Provider for enabling trackLinks, clickmap and notBounce
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 */
export const useEnableAllProvider = ctxErrorLogger(
    'e.a.p',
    (ctx: Window, counterOptions: CounterOptions): ProviderResult => {
        const counter = getCounterInstance(ctx, counterOptions);

        const enableAll = bindArgs(
            [
                pipe(firstArg, cont(true)),
                cFilter(
                    Boolean,
                    cMap(bindArg(counter, getPath), [
                        METHOD_NAME_CLICK_MAP,
                        METHOD_NAME_TRACK_LINKS,
                        METHOD_NAME_ACCURATE_TRACK_BOUNCE,
                    ]),
                ),
            ],
            cMap,
        );

        if (counterOptions.enableAll) {
            enableAll();
        }

        return {
            [METHOD_NAME_ENABLE_ALL]: enableAll,
        };
    },
);
