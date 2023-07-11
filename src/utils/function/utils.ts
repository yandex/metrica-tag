import { firstArg } from './identity';
import { pipe } from './pipe';
import { AnyFunc } from './types';

export type CallWithoutArguments = <T>(fn: () => T) => T;

export const call = <FnType extends AnyFunc | Function, ArgType>(
    fn: FnType,
    arg?: ArgType,
): FnType extends AnyFunc ? ReturnType<FnType> : never =>
    arg ? fn(arg) : fn();

export const callFirstArgument: <FnType extends AnyFunc>(
    fn: FnType,
) => ReturnType<FnType> = pipe(firstArg, call);
