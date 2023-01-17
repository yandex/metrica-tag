export const PARAMS_PROVIDER = '1';
export const METHOD_NAME_PARAMS = 'params';

export type ParamsHandler<T = any> = (...a: any[]) => T;

declare module 'src/utils/counter/type' {
    interface CounterObject {
        /** Transmits custom session parameters */
        [METHOD_NAME_PARAMS]?: ParamsHandler<CounterObject>;
    }
}
