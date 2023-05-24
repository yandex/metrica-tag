export const METHOD_NAME_SET_USER_ID = 'setUserID';
export const USER_ID_PARAM = 'user_id';

export type SetUserIDHandler<T = any> = (...args: any[]) => T;

declare module 'src/utils/counter/type' {
    interface CounterObject {
        /** Method for transmitting the user ID set by the site owner */
        [METHOD_NAME_SET_USER_ID]?: SetUserIDHandler<CounterObject>;
    }
}
