import {
    METHOD_NAME_FIRST_PARTY,
    METHOD_NAME_FIRST_PARTY_HASHED,
} from './const';

export interface FirstPartyInputData {
    [x: string]: string | number | FirstPartyInputData;
}

export type FirstPartyOutputData = [string, string | FirstPartyOutputData[]];

export type FirstPartyMethodHandler = (
    data: FirstPartyInputData,
) => Promise<unknown> | void;

declare module 'src/utils/counter/type' {
    interface CounterObject {
        [METHOD_NAME_FIRST_PARTY]?: FirstPartyMethodHandler;
        [METHOD_NAME_FIRST_PARTY_HASHED]?: FirstPartyMethodHandler;
    }
}
