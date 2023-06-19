/**
 * Intermediate state of counter parameters
 */
export interface CounterInfo {
    /** Counter id */
    id: number;
    /** Advertising network or default */
    type: number;
    /** Send not bounce event in strict timeout. Not bounce means that user not closed page */
    accurateTrackBounce?: boolean;
    /** Clicks heat map */
    clickmap?:
        | boolean
        | Partial<{
              filter: Function;
              ignoreTags: string[];
              quota: number;
          }>;
    /** Send URL hash changes */
    trackHash: boolean;
    /** Allow the clicks provider to track clicks */
    trackLinks?: boolean;
}

export type ExtraCounterInfo = {
    clickmap?: boolean;
};

/**
 * Reduced set of counter parameters for Ya.Metrika.counters()
 */
export type ExportedCounterInfo = CounterInfo & ExtraCounterInfo;

export type RawCounterInfo = Partial<CounterInfo>;

export type GetCountersMethod = () => ExportedCounterInfo[];
