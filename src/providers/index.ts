export const HIT_PROVIDER = 'h';

export const UNSUBSCRIBE_PROPERTY = 'u';

/**
 * Interface for extending providers in modules
 */
export interface PROVIDERS {
    HIT_PROVIDER: typeof HIT_PROVIDER;
}

export type Provider = PROVIDERS[keyof PROVIDERS];

export type ProvidersMap<T> = {
    [provider in Provider]?: T;
};
