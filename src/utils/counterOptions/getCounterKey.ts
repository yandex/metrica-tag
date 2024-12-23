import { memo } from '../function/memo';
import type { CounterOptions } from './types';

export const getCounterKey = memo((opt: CounterOptions) => {
    return `${opt.id}:${opt.counterType}`;
});
