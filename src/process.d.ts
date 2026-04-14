/**
 * Minimal process.env declaration for build-time string replacements
 * (rollup-plugin-replace). These are NOT real Node.js globals.
 */
declare const process: {
    env: Record<string, string | undefined>;
};
