export const METHOD_NAME_USER_PARAMS = 'userParams';
export type UserParamsHandler<T = any> = (...a: any[]) => T;

declare module 'src/utils/counter/type' {
    interface CounterObject {
        [METHOD_NAME_USER_PARAMS]?: UserParamsHandler<CounterObject>;
    }
}
