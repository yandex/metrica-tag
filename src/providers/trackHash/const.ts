export const METHOD_TRACK_HASH = 'trackHash';
export const TRACK_HASH_PROVIDER = 't';

declare module 'src/utils/counter/type' {
    interface CounterObject {
        /** Tracks URL hash change */
        [METHOD_TRACK_HASH]?: (run?: boolean) => void;
    }
}
