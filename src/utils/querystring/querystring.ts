import { REQUEST_BODY_KEY } from 'src/api/watch';
import { entries, isUndefined, isNil } from 'src/utils/object';
import { ctxJoin, pipe } from 'src/utils/function';
import { ctxReduce, ctxMap } from 'src/utils/array';
import { safeEncodeURIComponent } from './safeEncodeURI';

export const safeDecodeURIComponent = (encodedURIComponent: string) => {
    let returnValue = '';
    try {
        returnValue = decodeURIComponent(encodedURIComponent);
    } catch (error) {}

    return returnValue;
};

export const safeDecodeURI = (encodedURI: string) => {
    try {
        return decodeURI(encodedURI);
    } catch (error) {
        return '';
    }
};

export const bodyToQuery = (bodyStr: string) => {
    return `${REQUEST_BODY_KEY}=${safeEncodeURIComponent(bodyStr)}`;
};
export const parse = (query: string) => {
    if (!query) {
        return {};
    }
    return pipe(
        ctxMap((keyVal: string) => {
            const [key, val]: [string, string] = keyVal.split('=') as [
                string,
                string,
            ];
            return [
                key,
                isNil(val) ? undefined : safeDecodeURIComponent(val),
            ] as [string, string | undefined];
        }),
        ctxReduce(
            (
                rawObj: Record<string, string | undefined>,
                [key, val]: [string, string],
            ) => {
                const obj = rawObj;
                obj[key] = val;
                return obj;
            },
            {},
        ),
    )(query.split('&'));
};

/**
 *
 */
export const stringify = (obj: Record<string, any> | undefined): string => {
    if (!obj) {
        return '';
    }
    return pipe(
        entries,
        ctxReduce((out: string[], [key, val]: [string, string]) => {
            if (!isUndefined(val) && !isNil(val)) {
                out.push(`${key}=${safeEncodeURIComponent(val)}`);
            }
            return out;
        }, [] as string[]),
        ctxJoin('&'),
    )(obj);
};
