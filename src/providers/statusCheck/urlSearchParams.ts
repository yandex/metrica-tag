import { parse } from 'src/utils/querystring';
import { memo } from 'src/utils/function';
import { getLocation } from 'src/utils/location';
import { parseDecimalInt } from 'src/utils/number';

export const CHECK_URL_PARAM = '_ym_status-check';
export const LANG_URL_PARAM = '_ym_lang';

export const DEFAULT_LANGUAGE = 'ru';

/** Search parameters values */
interface StatusCheckSearchParams {
    /** Status check */
    id: number;
    /** Language */
    lang: string;
}

export const getStatusCheckSearchParams = memo(
    (ctx: Window): StatusCheckSearchParams => {
        const location = getLocation(ctx);
        const searchParams = parse(location.search.substring(1));

        return {
            id: parseDecimalInt(searchParams[CHECK_URL_PARAM] || ''),
            lang: searchParams[LANG_URL_PARAM] || DEFAULT_LANGUAGE,
        };
    },
);
