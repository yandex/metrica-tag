/* global process */
import compiler from '@ampproject/rollup-plugin-closure-compiler';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'rolldown';
import { visualizer } from 'rollup-plugin-visualizer';
import {
    DEFAULT_BUNDLE_VERSION,
    buildDir,
    pureFunctions,
} from './scripts/build/utils.ts';

if (!process.env.VERSION) {
    process.env.VERSION = DEFAULT_BUNDLE_VERSION;
}

const fileName = 'watch.js';
const path = buildDir(`./public/${fileName}`);
const version = 'public';

const flags = JSON.parse(readFileSync('./features.json', 'utf-8')).reduce(
    (carry, feature) => {
        /**
         * NOTE: To make rollup cut off the code under feature flags
         * it is necessary to make all flags defined at build time as either true or false (undefined won't work).
         * Thus both true and false value are set here.
         */
        // eslint-disable-next-line no-param-reassign
        carry[feature.code] = !feature.disabled;
        return carry;
    },
    {},
);

export default defineConfig({
    input: 'src/index.ts',
    treeshake: {
        annotations: true,
        propertyReadSideEffects: false,
        manualPureFunctions: pureFunctions,
    },
    transform: {
        define: {
            'process.env.BUILD_FLAGS': JSON.stringify(flags),
            'process.env.JS_NAME': `"${fileName}"`,
            'process.env.ARG_OPTIONS': JSON.stringify({
                construct: 'Metrika',
                callbackPostfix: '',
                version,
                host: 'mc.yandex.ru',
            }),
            'process.env.VERSION': `"${process.env.VERSION}"`,
        },
        target: 'es6',
    },
    resolve: {
        extensions: ['.js', '.ts'],
        modules: ['node_modules'],
    },
    platform: 'browser',
    tsconfig: './tsconfig.rollup.json',
    plugins: [
        // Closure compiler still supports ES3 as target
        compiler({
            compilation_level: 'ADVANCED',
            isolation_mode: 'IIFE',
            rewrite_polyfills: 'false',
            language_in: 'ECMASCRIPT_2015',
            externs: './closure-compiler.js',
            jscomp_off: ['checkVars', 'checkTypes'],
            language_out: 'ECMASCRIPT3',
            env: 'BROWSER',
            warning_level: 'VERBOSE',
        }),
        visualizer({
            filename: path.replace(/\.js$/, '.html'),
            sourcemap: true,
        }),
    ],
    output: {
        file: path,
        format: 'iife',
        sourcemap: true,
        // Minify twice in order to remove whitespaces after bundling
        minify: true,
    },
});
