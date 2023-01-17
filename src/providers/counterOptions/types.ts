/**
 * Function for parsing parameters into a single format
 */
export type NormalizeFunction = (value: unknown) => unknown;

/**
 * Options to initialize parameter
 */
export type OptionInitializer = {
    /** Parameter name */
    optKey: string;
    /** Function for parsing parameters into a single format */
    normalizeFunction?: NormalizeFunction;
};

/**
 * Normalization functions of the corresponding parameters
 */
export type OptionsKeysMaps = Record<string, OptionInitializer>;
