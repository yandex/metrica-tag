import { Feature } from 'generated/features';

/**
 * Build-time parameters
 */
export type ConfigOptions = {
    /**
     * The name of constrictor functions in Ya namespace.
     * The counter constructor is written to window.Ya.(constructor).
     */
    construct: string;

    /**
     * The name of callback to be called after all metrika functionality being initialized.
     */
    callbackPostfix: string;

    /**
     * The script version uniquely identifying the combination of flags being used.
     */
    version: string;

    /**
     * The host to send data to.
     */
    host: string;
};

export type Args = Readonly<ConfigOptions>;

export type BuildFlags = {
    [key in Feature]: boolean;
};
