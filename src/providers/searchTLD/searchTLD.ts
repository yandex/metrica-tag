import { host } from 'src/config';
import { cReduce } from 'src/utils/array';

type TldOverride = (ctx: Window, resource?: string) => string | undefined;
export const TLD_OVERRIDES: TldOverride[] = [];

/**
 * Changes recipient domain based on active features
 * @param ctx - Current window
 * @param resource - Domain where to send data
 */
export const getDomainAndTLD = (ctx: Window, resource?: string) => {
    return (
        cReduce<TldOverride, string | undefined>(
            (result, overrideFunction) => {
                return result || overrideFunction(ctx, resource);
            },
            undefined,
            TLD_OVERRIDES,
        ) || host
    );
};
