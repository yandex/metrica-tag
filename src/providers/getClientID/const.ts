export const METHOD_NAME_GET_CLIENT_ID = 'getClientID';
export type GetClientIDHandler = (...args: any[]) => string;

declare module 'src/utils/counter/type' {
    interface CounterObject {
        /** Gets the user ID assigned by Metrica */
        [METHOD_NAME_GET_CLIENT_ID]?: GetClientIDHandler;
    }
}
