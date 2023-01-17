import {
    ProviderFunction,
    StaticMethodInitializer,
    WindowProviderInitializer,
} from 'src/types';

export const providersAsync: ProviderFunction[] = [];
// After hit providers
export const providersSync: ProviderFunction[] = [];
// Before hit providers
export const beforeHitProviders: ProviderFunction[] = [];
export const prioritizedProviders: ProviderFunction[] = [];
// Window namespace providers
export const staticMethodInitializers: StaticMethodInitializer[] = [];
export const windowProviderInitializers: WindowProviderInitializer[] = [];
