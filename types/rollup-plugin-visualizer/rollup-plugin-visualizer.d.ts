declare module 'rollup-plugin-visualizer' {
    import { Plugin } from 'rollup';
    import * as open from 'open';

    /**
     * Options for rollup-plugin-visualizer
     * @see https://github.com/btd/rollup-plugin-visualizer
     */
    export interface VisualizerOption {
        /**
         * Create JSON output if `filename` option is not set.
         *
         * @default false
         */
        json?: boolean;

        /**
         * Name of the file with diagram to generate
         *
         * @default stats.{ext depending template}
         */
        filename?: string;

        /**
         * Title tag value
         *
         * @default Rollup Visualizer
         */
        title?: string;

        /**
         * Open generated file in default user agent
         *
         * @default false
         */
        open?: boolean;

        /**
         * Options provided to the open process.
         *
         * @default {}
         */
        openOptions?: open.Options;

        /**
         * Which diagram type to use: sunburst, treemap, network.
         *
         * @default treemap
         */
        template?: 'sunburst' | 'treemap' | 'network';

        /**
         * Collect gzip size from source code and display it at chart.
         *
         * @default false
         */
        gzipSize?: boolean;

        /**
         * Collect brotli size from source code and display it at chart.
         *
         * @default false
         */
        brotliSize?: boolean;

        /**
         * Use sourcemaps to calculate sizes (e.g. after UglifyJs or Terser). Always add plugin as last option.
         *
         * @default false
         */
        sourcemap?: boolean;
    }

    export default (options?: VisualizerOption): Plugin => {};
}
