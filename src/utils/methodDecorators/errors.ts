import { errorLogger } from 'src/utils/errorLogger/errorLogger';
import type { Decorator } from './types';

export const errorsDecorator: Decorator<unknown> = (
    ctx,
    counterOptions,
    methodName,
    fn,
) => errorLogger(ctx, `cm.${methodName}`, fn);
