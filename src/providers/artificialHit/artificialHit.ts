import {
    WATCH_URL_PARAM,
    WATCH_REFERER_PARAM,
    PAGE_VIEW_BR_KEY,
    ARTIFICIAL_BR_KEY,
} from 'src/api/watch';
import { CounterOptions, getCounterKey } from 'src/utils/counterOptions';
import { getSender } from 'src/sender';
import { SenderInfo } from 'src/sender/SenderInfo';
import { browserInfo } from 'src/utils/browserInfo/browserInfo';
import { getLocation } from 'src/utils/location/location';
import { isObject, mix } from 'src/utils/object';
import { memo } from 'src/utils/function/memo';
import { finallyCallUserCallback } from 'src/utils/function/finallyCallUserCallback';
import { getLoggerFn } from 'src/providers/debugConsole/debugConsole';
import { constructObject } from 'src/utils/function/construct';
import { noop } from 'src/utils/function/noop';
import { ArtificialHitOptions, ArtificialHandler } from './type';
import { METHOD_NAME_HIT, ARTIFICIAL_HIT_PROVIDER } from './const';
import { PAGE_VIEW_CONSOLE_MESSAGE } from '../consoleRenderer/dictionary';

const ARTIFICIAL_TITLE_KEY = 'title';
const ARTIFICIAL_REFERRER_KEY = 'referrer';
const ARTIFICIAL_REF_KEY = 'referer';
const ARTIFICIAL_PARAMS_KEY = 'params';
const ARTIFICIAL_CALLBACK_KEY = 'callback';
const ARTIFICIAL_CTX_KEY = 'ctx';

/**
 * Stores artificial hit data
 */
export type ArtificialState = {
    /** Artificial hit URL */
    url?: string;
    /** Artificial hit referrer */
    ref?: string;
};

export const getArtificialState = memo(
    constructObject as any as (opt: CounterOptions) => ArtificialState,
    getCounterKey,
);

const argsToOptions = (
    title?: string | ArtificialHitOptions,
    referrer?: string,
    params?: Record<string, any>,
    callback?: (...args: any[]) => any,
    ctx?: any,
): ArtificialHitOptions => {
    if (isObject(title)) {
        const options = title as ArtificialHitOptions;
        return {
            title: options[ARTIFICIAL_TITLE_KEY],
            referrer:
                options[ARTIFICIAL_REFERRER_KEY] || options[ARTIFICIAL_REF_KEY],
            params: options[ARTIFICIAL_PARAMS_KEY],
            callback: options[ARTIFICIAL_CALLBACK_KEY],
            ctx: options[ARTIFICIAL_CTX_KEY],
        };
    }
    return {
        title,
        referrer,
        params,
        callback,
        ctx,
    };
};

/**
 * Hit created manually by calling .hit()
 * @param ctx - Current window
 * @param counterOpt - Counter options during initialization
 */
export const artificialHitProvider = (
    ctx: Window,
    counterOpt: CounterOptions,
): { [METHOD_NAME_HIT]: ArtificialHandler } => {
    const sender = getSender(ctx, ARTIFICIAL_HIT_PROVIDER, counterOpt);

    return {
        [METHOD_NAME_HIT]: (
            url?: string,
            title?: string | ArtificialHitOptions,
            referrer?: string,
            params?: Record<string, any>,
            callback?: (...args: any[]) => any,
            fnCtx?: any,
        ): Promise<any> | undefined => {
            const senderOpt: SenderInfo = {
                urlParams: {},
                brInfo: browserInfo({
                    [PAGE_VIEW_BR_KEY]: 1,
                    [ARTIFICIAL_BR_KEY]: 1,
                }),
            };
            const options = argsToOptions(
                title,
                referrer,
                params,
                callback,
                fnCtx,
            );
            const state = getArtificialState(counterOpt);
            const pageUrl = url || getLocation(ctx).href;

            if (state.url !== pageUrl) {
                state.ref = state.url;
                state.url = url;
            }

            const pageRef =
                options.referrer || state.ref || ctx.document.referrer;

            const logHit = getLoggerFn(
                ctx,
                counterOpt,
                PAGE_VIEW_CONSOLE_MESSAGE,
                {
                    ['id']: counterOpt.id,
                    ['url']: pageUrl,
                    ['ref']: pageRef,
                },
                options.params,
            );
            const middlewareInfo = mix(senderOpt.middlewareInfo || {}, {
                params: options.params,
                title: options.title,
            });

            const result = sender(
                mix(senderOpt, {
                    middlewareInfo,
                    urlParams: mix(senderOpt.urlParams || {}, {
                        [WATCH_URL_PARAM]: pageUrl,
                        [WATCH_REFERER_PARAM]: pageRef,
                    }),
                }),
                counterOpt,
            ).then(logHit);

            return finallyCallUserCallback(
                ctx,
                'p.ar.s',
                result,
                options.callback || noop,
                options.ctx,
            );
        },
    };
};
