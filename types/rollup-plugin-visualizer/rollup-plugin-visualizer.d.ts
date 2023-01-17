declare module 'rollup-plugin-visualizer' {
    import { Plugin } from 'rollup';

    /**
     * Options for rollup-plugin-visualizer
     * @see https://github.com/btd/rollup-plugin-visualizer
     */
    export interface VisualizerOption {
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
         * Which diagram type to use: sunburst, treemap, network, raw-data, list.
         *
         * @default treemap
         */
        template?: string;

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
    }

    export default (options?: VisualizerOption): Plugin => {};
}
