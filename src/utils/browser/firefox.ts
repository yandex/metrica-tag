import { getPath } from 'src/utils/object/path';
import { memo } from 'src/utils/function/memo';
import { bindArg } from 'src/utils/function/bind/bind';
import { checkUserAgent, getAgent } from './utils';
import { isNil } from '../object/assertions';
import { parseDecimalInt } from '../number/number';

export const isGecko = memo(bindArg(/gecko/, checkUserAgent));
export const isFFVersionRegExp = /Firefox\/([0-9]+)/i;

export const isFF = memo((ctx: Window) => {
    const style = getPath(ctx, 'document.documentElement.style');
    const InstallTrigger = getPath(ctx, 'InstallTrigger');
    const hasFFVersion = checkUserAgent(isFFVersionRegExp, ctx);
    isFFVersionRegExp.lastIndex = 0;

    return (
        !!(style && 'MozAppearance' in style && !isNil(InstallTrigger)) ||
        hasFFVersion
    );
});

export const getFFVersion = (ctx: Window): number => {
    if (isFF(ctx)) {
        const agent = getAgent(ctx);
        const version = agent.match(isFFVersionRegExp);
        if (version && version.length) {
            return parseDecimalInt(version[1]);
        }
        return 1;
    }
    return 0;
};
