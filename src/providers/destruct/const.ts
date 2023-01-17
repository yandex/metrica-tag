export const METHOD_DESTRUCT = 'destruct';

export type DestructHandler<T = unknown> = () => T;

declare module 'src/utils/counter/type' {
    interface CounterObject {
        /** Method for deinitializing the counter */
        [METHOD_DESTRUCT]?: DestructHandler<CounterObject>;
    }
}
