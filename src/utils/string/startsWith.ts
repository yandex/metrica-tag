import { pipe } from 'src/utils/function/pipe';
import { curry2SwapArgs, equal } from 'src/utils/function/curry';
import { stringIndexOf } from './string';

export const startsWith = pipe(stringIndexOf, equal(0));
export const startsWithString = curry2SwapArgs(startsWith);
