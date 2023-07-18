import { bindArgs } from 'src/utils/function';
import { ternary } from 'src/utils/condition/condition';

export const toOneOrNull = bindArgs([1, null], ternary) as (
    smt: any,
) => 1 | null;

export const toZeroOrOne = bindArgs([1, 0], ternary) as (smt: unknown) => 1 | 0;
