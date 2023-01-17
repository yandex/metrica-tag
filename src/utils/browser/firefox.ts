import { getPath } from 'src/utils/object/path';
import { memo } from 'src/utils/function/memo';
import { bindArg } from 'src/utils/function/bind/bind';
import { checkUserAgent } from './utils';
import { isNil } from '../object/assertions';

export const isGecko = memo(bindArg(/gecko/, checkUserAgent));

export const isFF = memo((ctx: Window) => {
    const style = getPath(ctx, 'document.documentElement.style');
    const InstallTrigger = getPath(ctx, 'InstallTrigger');
    return !!(style && 'MozAppearance' in style && !isNil(InstallTrigger));
});
