export interface FirstPartyInputData {
    [x: string]: string | FirstPartyInputData;
}

export type FirstPartyOutputData = [string, string | FirstPartyOutputData[]];

export type FirstPartyMethodHandler = (
    data: FirstPartyInputData,
) => Promise<unknown> | void;

export const METHOD_NAME_FIRST_PARTY = 'firstPartyParams';
export const METHOD_NAME_FIRST_PARTY_HASHED = 'firstPartyParamsHashed';
export const FIRST_PARTY_PARAMS_KEY = 'fpp';
export const FIRST_PARTY_HASHED_PARAMS_KEY = 'fpmh';
export const GMAIL_DOMAIN = 'gmail.com';
export const GOOGLEMAIL_DOMAIN = 'googlemail.com';

declare module 'src/utils/counter/type' {
    interface CounterObject {
        [METHOD_NAME_FIRST_PARTY]?: FirstPartyMethodHandler;
        [METHOD_NAME_FIRST_PARTY_HASHED]?: FirstPartyMethodHandler;
    }
}
