import { errorLogger } from 'src/utils/errorLogger';
import type { Decorator } from './types';

export const errorsDecorator: Decorator = (
    ctx,
    counterOptions,
    methodName,
    fn,
) => errorLogger(ctx, `cm.${methodName}`, fn);
