import { curry2 } from '../curry';
import { AnyFunc } from '../types';
import { bindArgs, bindThisForMethod } from './bind';

export const ctxBindArgs: (args: any[]) => (fn: AnyFunc) => AnyFunc =
    curry2(bindArgs);

export const ctxBindThisForMethod: (name: string) => (obj: any) => AnyFunc =
    curry2(bindThisForMethod);
