import { curry2SwapArgs, equal, pipe } from '../function';
import { stringIndexOf } from './string';

export const startsWith = curry2SwapArgs(pipe(stringIndexOf, equal(0)));
