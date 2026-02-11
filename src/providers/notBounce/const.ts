export const DEFAULT_NOT_BOUNCE_TIMEOUT = 15000;
export const METHOD_NAME_NOT_BOUNCE = 'notBounce';
export const LAST_NOT_BOUNCE_LS_KEY = 'lastHit';
export const APPROXIMATE_VISIT_DURATION = 30 * 60000;
export const METHOD_NAME_ACCURATE_TRACK_BOUNCE = 'accurateTrackBounce';

export const NOT_BOUNCE_HIT_PROVIDER = 'n';

/**
 * Function for sending not bounce hit manually
 */
export type NotBounceHandler<T = any> = (options?: {
    /** Context */
    ctx: any;
    /** Function to be called after sending */
    callback: (...args: any) => any;
}) => T;

/**
 * Function for manually setting timer for sending not bounce hit after specified period of time
 * @param time - Wait time before sending the hit
 */
export type AccurateTrackBounceHandler<T = any> = (
    time?: number | boolean,
) => T;

declare module 'src/utils/counter/type' {
    interface CounterObject {
        /** Function for sending not bounce hit manually */
        [METHOD_NAME_NOT_BOUNCE]?: NotBounceHandler<CounterObject>;
        /** Function for manually setting timer for sending not bounce hit after specified period of time */
        [METHOD_NAME_ACCURATE_TRACK_BOUNCE]?: AccurateTrackBounceHandler<CounterObject>;
    }
}
