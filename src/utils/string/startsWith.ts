import { curry2SwapArgs, equal, pipe } from '../function';
import { stringIndexOf } from './string';

export const startsWith = pipe(stringIndexOf, equal(0));
export const startsWithString = curry2SwapArgs(startsWith);
