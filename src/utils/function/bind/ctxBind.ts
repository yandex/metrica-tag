import { curry2 } from '../curry';
import { bindArgs, bindThisForMethod } from './bind';

export const ctxBindArgs = curry2(bindArgs);

export const ctxBindThisForMethod = curry2(bindThisForMethod);
