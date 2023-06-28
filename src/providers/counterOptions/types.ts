import type { CounterOption } from 'src/utils/counterOptions';

/**
 * Function for parsing parameters into a single format
 */
export type NormalizeFunction = (value: unknown) => unknown;

/**
 * Option definition object
 */
export type OptionInitializer = {
    /** Option name */
    optKey: string;
    /** A function for parsing the option into a unified format */
    normalizeFunction?: NormalizeFunction;
};

export type OptionInitializerMap<T extends CounterOption> = Record<
    T,
    OptionInitializer
>;

/**
 * Normalization functions of the corresponding parameters
 */
export type OptionsKeysMaps = Record<string, OptionInitializer>;
