import {
    ProviderFunction,
    StaticMethodInitializer,
    WindowProviderInitializer,
} from 'src/types';

/**
 * Any functionality that needs to be run ASAP.
 * E.g. early returns from constructor, or any essential logic required prior to normal operation.
 */
export const prioritizedProviders: ProviderFunction[] = [];

/**
 * Before hit providers
 * Any actions that need to be run before the first hit (e.g. counter setup),
 * but not as urgent as prioritizedProviders.
 */
export const beforeHitProviders: ProviderFunction[] = [];

/**
 * After hit providers
 * Here goes any functionality that does nto affect the first hit, but requires synchronous run.
 * The following providers might belong to this kind:
 * - counter method initialization;
 * - providers that depend on CounterSettings, but have an option of early return upon specific conditions (monkey patching, specific UA, etc.);
 * - anything else that have some high priority and is expected to be run early.
 */
export const providersSync: ProviderFunction[] = [];

/**
 * Providers run asynchronously
 * Everything that can wait with its initialization,
 * e.g. providers dependant on CounterSetting.
 */
export const providersAsync: ProviderFunction[] = [];

/**
 * Counter static methods (available as `Ya.Metrika2.fn()`).
 * Global functions that do not use Counter ID.
 */
export const staticMethodInitializers: StaticMethodInitializer[] = [];

/**
 * Providers not tied to a particular counter ID.
 * These are run at the end of the script and do not require a counter to be initialized.
 */
export const windowProviderInitializers: WindowProviderInitializer[] = [];
