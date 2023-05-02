import replace from '@rollup/plugin-replace';
import clean from 'rollup-plugin-cleanup';
import { rollup, RollupOptions, OutputOptions } from 'rollup';
import ts from 'typescript';
import typescript from 'rollup-plugin-typescript2';
import compiler from '@ampproject/rollup-plugin-closure-compiler';
import progress from 'rollup-plugin-progress';
import commonjs from '@rollup/plugin-commonjs';
import visualizer from 'rollup-plugin-visualizer';
import resolve from '@rollup/plugin-node-resolve';
import commandLineArgs from 'command-line-args';
import { disabledFeatures, features } from 'generated/features';
import {
    markPureFunctions,
    pureFunctions,
    pureTsHelpers,
} from './transformers';
import { addBOMMark, buildDir, DEFAULT_BUNDLE_VERSION } from './utils';

if (!process.env.VERSION) {
    process.env.VERSION = DEFAULT_BUNDLE_VERSION;
}

interface ArgOptions {
    'no-uglify'?: boolean;
}

const argOptions = commandLineArgs([
    { name: 'no-uglify', alias: 'u', type: Boolean },
]) as ArgOptions;

const fileName = 'watch.js';
const path = buildDir(`./public/${fileName}`);
const version = 'public';

const flags = features.reduce((carry: Record<string, boolean>, feature) => {
    /**
     * NOTE: To make rollup cut off the code under feature flags
     * it is necessary to make all flags defined at build time as either true or false (undefined won't work).
     * Thus both true and false value are set here.
     */
    carry[feature] = !disabledFeatures.includes(feature);
    return carry;
}, {});

const transformer = (): ts.CustomTransformers => {
    return {
        before: [markPureFunctions(pureFunctions, true)],
        after: [markPureFunctions(pureTsHelpers, false)],
    };
};

const inputOptions: RollupOptions = {
    input: 'src/index.ts',
    treeshake: {
        annotations: true,
    },
    plugins: [
        replace({
            values: {
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
        }),
        resolve({
            extensions: ['.js', '.ts'],
            preferBuiltins: false,
            dedupe: ['promise-polyfill'],
            browser: true,
            customResolveOptions: {
                moduleDirectory: ['node_modules'],
            },
        }),
        commonjs({
            include: ['node_modules/**'],
        }),
        typescript({
            clean: true,
            tsconfig: './tsconfig.rollup.json',
            transformers: [transformer],
        }),
        progress(),
        argOptions['no-uglify']
            ? ''
            : compiler({
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
        clean({
            comments: 'none',
        }),
        visualizer({
            filename: path.replace(/\.js$/, '.html'),
        }),
    ],
};
const outputOptions: OutputOptions = {
    file: path,
    format: 'iife',
    freeze: false,
    banner: 'try {',
    footer: '} catch (e) { }',
};

const build = async () => {
    try {
        const rollUpBundle = await rollup(inputOptions);
        console.log('Writing output');
        await rollUpBundle.write(outputOptions);
        console.log('Adding BOM mark');
        addBOMMark(outputOptions.file!);
        console.log('Build successful!');
    } catch (e) {
        console.log('Build failed!');
        throw e;
    }
};

build();
