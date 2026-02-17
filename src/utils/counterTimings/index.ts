import { constructObject } from '../function/construct';
import { memo } from '../function/memo';
import type { CounterTimings } from './types';

export const counterTimingStore = memo(
    constructObject as (counterKey: string) => CounterTimings,
);
