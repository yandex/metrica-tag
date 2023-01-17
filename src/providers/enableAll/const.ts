export const METHOD_NAME_ENABLE_ALL = 'enableAll';

export type EnableAllHandler<T = any> = () => T;

declare module 'src/utils/counter/type' {
    interface CounterObject {
        /** Enables trackLinks, clickmap and notBounce */
        [METHOD_NAME_ENABLE_ALL]?: EnableAllHandler<CounterObject>;
    }
}
