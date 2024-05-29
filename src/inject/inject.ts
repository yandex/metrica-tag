/**
 * @file Build time variables defined via string replacement by rollup-plugin-replace
 */

import { BuildFlags, Args } from './types';

/**
 * Build flags, indicate which features are included and which are not.
 */
export const flags: BuildFlags = process.env.BUILD_FLAGS as any;

/**
 * Build arguments - the definition of the script identity,
 * how the counter is initialized and where the data is sent.
 */
export const argOptions: Args = process.env.ARG_OPTIONS as any;

/**
 * File name
 */
export const resourceId = process.env.JS_NAME as string;

/**
 * Release version
 */
export const getVersion: () => string = () => process.env.VERSION! || '25';
