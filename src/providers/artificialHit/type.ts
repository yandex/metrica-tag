import { METHOD_NAME_HIT } from './const';

/**
 * Params to be sent to backend
 */
export type ArtificialHitOptions = {
    /** Page referrer */
    referer?: string;
    /** The function that will be called after sending the hit */
    callback?: (...args: any[]) => any;
    /** Callback context */
    ctx?: any;
    /** Visit parameters to be sent with a hit */
    params?: Record<string, any>;
    /** Page title */
    title?: string;
};

/**
 * Hit data handler
 */
export type ArtificialHandler<T = any> = (
    /** Artificial pseudo URL */
    url?: string,
    /** Page title */
    title?: string | ArtificialHitOptions,
    /** Page referrer */
    referer?: string,
    /** Visit parameters to be sent with a hit */
    params?: Record<string, any>,
    /** The function that will be called after sending the hit */
    callback?: (...args: any[]) => any,
    /** Callback context */
    fnCtx?: any,
) => T;

declare module 'src/utils/counter/type' {
    interface CounterObject {
        /** Artificial hit */
        [METHOD_NAME_HIT]?: ArtificialHandler<CounterObject>;
    }
}
