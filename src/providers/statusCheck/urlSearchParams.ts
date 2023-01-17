import { parse } from 'src/utils/querystring';
import { memo, pipe } from 'src/utils/function';
import { getLocation } from 'src/utils/location';
import { ctxPath } from 'src/utils/object';
import { parseDecimalInt } from 'src/utils/number';

export const CHECK_URL_PARAM = '_ym_status-check';
export const LANG_URL_PARAM = '_ym_lang';

export const DEFAULT_LANGUAGE = 'ru';

/** Search parameters values */
interface StatusCheckSearchParams {
    /** Status check */
    [CHECK_URL_PARAM]: string;
    /** Language */
    [LANG_URL_PARAM]: string;
}

const getSearchParams = memo((ctx: Window) => {
    const location = getLocation(ctx);
    const searchParams: Partial<StatusCheckSearchParams> = parse(
        location.search.substring(1),
    );

    searchParams[CHECK_URL_PARAM] = searchParams[CHECK_URL_PARAM] || '';
    searchParams[LANG_URL_PARAM] =
        searchParams[LANG_URL_PARAM] || DEFAULT_LANGUAGE;

    return searchParams as StatusCheckSearchParams;
});

export const counterIdForCheck = pipe(
    getSearchParams,
    ctxPath(CHECK_URL_PARAM),
    parseDecimalInt,
);

export const langForCheck = pipe(getSearchParams, ctxPath(LANG_URL_PARAM));
