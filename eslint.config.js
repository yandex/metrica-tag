/* global require, module, __dirname */
const { defineConfig, globalIgnores } = require('eslint/config');

const ban = require('eslint-plugin-ban');
const n = require('eslint-plugin-n');
const globals = require('globals');
const noOnlyTests = require('eslint-plugin-no-only-tests');
const js = require('@eslint/js');
const importPlugin = require('eslint-plugin-import');
const prettier = require('eslint-config-prettier/flat');
const { configs: tsConfigs } = require('typescript-eslint');

const {
    bannedFunctions,
    bannedProperties,
    defaultRestrictedProperties,
} = require('./eslintBannedFunctions');

module.exports = defineConfig([
    {
        name: 'tag',
        extends: [
            js.configs.recommended,
            importPlugin.flatConfigs.recommended,
            prettier,
        ],

        languageOptions: {
            ecmaVersion: 2021,
            parserOptions: {
                projectService: {
                    allowDefaultProject: ['*.js'],
                },
                tsconfigRootDir: __dirname,
            },

            globals: {
                BigInt: true,
            },
        },

        settings: {
            'import/extensions': ['.js', '.ts'],

            'import/parsers': {
                '@typescript-eslint/parser': ['.ts'],
            },

            'import/resolver': {
                typescript: {},

                node: {
                    extensions: ['.js', '.ts'],
                },
            },
        },

        rules: {
            'accessor-pairs': 'off',

            'array-callback-return': [
                'error',
                {
                    allowImplicit: true,
                },
            ],

            'block-scoped-var': 'error',
            complexity: ['off', 20],
            'consistent-return': 'error',
            curly: ['error', 'multi-line'],

            'default-case': [
                'error',
                {
                    commentPattern: '^no default$',
                },
            ],

            'default-case-last': 'error',
            'default-param-last': 'error',

            eqeqeq: [
                'error',
                'always',
                {
                    null: 'ignore',
                },
            ],

            'grouped-accessor-pairs': 'error',
            'guard-for-in': 'error',
            'max-classes-per-file': ['error', 1],
            'no-alert': 'warn',
            'no-caller': 'error',
            'no-case-declarations': 'error',
            'no-constructor-return': 'error',
            'no-div-regex': 'off',

            'no-else-return': [
                'error',
                {
                    allowElseIf: false,
                },
            ],

            'no-empty-pattern': 'error',
            'no-eq-null': 'off',
            'no-eval': 'error',
            'no-extend-native': 'error',
            'no-extra-bind': 'error',
            'no-extra-label': 'error',
            'no-fallthrough': 'error',

            'no-global-assign': [
                'error',
                {
                    exceptions: [],
                },
            ],

            'no-native-reassign': 'off',

            'no-implicit-coercion': [
                'off',
                {
                    boolean: false,
                    number: true,
                    string: true,
                    allow: [],
                },
            ],

            'no-implicit-globals': 'off',
            'no-implied-eval': 'error',
            'no-invalid-this': 'off',
            'no-iterator': 'error',

            'no-labels': [
                'error',
                {
                    allowLoop: false,
                    allowSwitch: false,
                },
            ],

            'no-lone-blocks': 'error',
            'no-loop-func': 'error',

            'no-magic-numbers': [
                'off',
                {
                    ignore: [],
                    ignoreArrayIndexes: true,
                    enforceConst: true,
                    detectObjects: false,
                },
            ],

            'no-multi-str': 'error',
            'no-new': 'error',
            'no-new-func': 'error',
            'no-new-wrappers': 'error',
            'no-nonoctal-decimal-escape': 'error',
            'no-octal': 'error',
            'no-octal-escape': 'error',

            'no-param-reassign': [
                'error',
                {
                    props: true,
                    ignorePropertyModificationsFor: [
                        'acc',
                        'accumulator',
                        'e',
                        'ctx',
                        'context',
                    ],
                },
            ],

            'no-proto': 'error',
            'no-redeclare': 'error',
            'no-restricted-properties': defaultRestrictedProperties,
            'no-return-assign': ['error', 'always'],
            'no-script-url': 'error',

            'no-self-assign': [
                'error',
                {
                    props: true,
                },
            ],

            'no-self-compare': 'error',
            'no-sequences': 'error',
            'no-throw-literal': 'error',
            'no-unmodified-loop-condition': 'off',

            'no-unused-expressions': [
                'error',
                {
                    allowShortCircuit: false,
                    allowTernary: false,
                    allowTaggedTemplates: false,
                },
            ],

            'no-unused-labels': 'error',
            'no-useless-call': 'off',
            'no-useless-catch': 'error',
            'no-useless-concat': 'error',
            'no-useless-escape': 'error',
            'no-useless-return': 'error',
            'no-void': 'error',

            'no-warning-comments': [
                'off',
                {
                    terms: ['todo', 'fixme', 'xxx'],
                    location: 'start',
                },
            ],

            'no-with': 'error',

            'prefer-promise-reject-errors': [
                'error',
                {
                    allowEmptyReject: true,
                },
            ],

            'prefer-named-capture-group': 'off',
            radix: 'error',
            'require-await': 'off',
            'require-unicode-regexp': 'off',
            'vars-on-top': 'error',

            yoda: 'error',

            'no-empty': [
                'error',
                {
                    allowEmptyCatch: true,
                },
            ],
        },
    },
    globalIgnores([
        '_build',
        'coverage',
        'hooks',
        '**/node_modules',
        '!**/.*',
        'closure-compiler.js',
    ]),
    {
        name: 'tag/ts',
        files: ['**/*.ts'],

        extends: [
            js.configs.recommended,
            importPlugin.flatConfigs.typescript,
            tsConfigs.strict,
            tsConfigs.stylistic,
            prettier,
        ],

        plugins: {
            ban,
            n,
        },

        languageOptions: {
            globals: {
                ...globals.browser,
                env: 'readonly',
            },
            parserOptions: {
                tsconfigRootDir: __dirname,
            },
        },

        rules: {
            'n/no-process-env': 'error',
            'ban/ban': bannedFunctions,
            'no-restricted-properties':
                defaultRestrictedProperties.concat(bannedProperties),
            '@typescript-eslint/prefer-interface': 'off',
            curly: 'error',
            'dot-notation': 'off',
            'no-useless-computed-key': 'off',
            '@typescript-eslint/explicit-member-accessibility': 'off',
            'class-methods-use-this': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
            'import/no-extraneous-dependencies': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            'import/prefer-default-export': 'off',

            'import/extensions': [
                'error',
                'ignorePackages',
                {
                    js: 'never',
                    mjs: 'never',
                    jsx: 'never',
                    ts: 'never',
                    tsx: 'never',
                },
            ],

            '@typescript-eslint/no-empty-function': 'off',

            '@typescript-eslint/no-this-alias': [
                'error',
                {
                    allowDestructuring: true,
                    allowedNames: ['that'],
                },
            ],

            'no-param-reassign': [
                'error',
                {
                    props: false,
                },
            ],

            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            'prefer-rest-params': 'off',
            'prefer-spread': 'off',
            'prefer-object-spread': 'off',
            'prefer-regex-literals': 'off',
            'default-param-last': 'off',
            'no-shadow': 'off',
            '@typescript-eslint/no-shadow': 'error',
            'no-use-before-define': 'off',

            '@typescript-eslint/no-use-before-define': [
                'error',
                {
                    functions: false,
                },
            ],
            // New recommended rules
            '@typescript-eslint/consistent-type-definitions': 'off',
            '@typescript-eslint/no-dynamic-delete': 'off',
            '@typescript-eslint/consistent-indexed-object-style': 'off',
            '@typescript-eslint/prefer-for-of': 'off',
            '@typescript-eslint/no-invalid-void-type': 'off',
            '@typescript-eslint/no-wrapper-object-types': 'off',
        },
    },
    {
        name: 'tag/generated',
        files: ['generated/**/*'],

        languageOptions: {
            parserOptions: {
                tsconfigRootDir: __dirname,
            },
        },

        rules: {
            camelcase: 'off',
            '@typescript-eslint/no-use-before-define': 'off',
        },
    },
    {
        name: 'tag/unit-tests',
        files: ['**/__tests__/**/*.ts', '**/*.spec.ts', '**/*.spec.js'],

        plugins: {
            'no-only-tests': noOnlyTests,
        },

        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.mocha,
            },
            parserOptions: {
                tsconfigRootDir: __dirname,
            },
        },

        rules: {
            'import/no-extraneous-dependencies': 'off',
            'import/no-named-as-default-member': 'off',
            'import/namespace': 'off',
            'ban/ban': 'off',
            'no-restricted-properties': defaultRestrictedProperties,
            'no-unused-expressions': 'off',

            'no-only-tests/no-only-tests': [
                'error',
                {
                    block: ['describe', 'it', 'onlyForBrowserTest'],
                },
            ],

            'max-classes-per-file': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
        },
    },
    {
        name: 'tag/scripts',
        files: ['./scripts/**/*'],

        languageOptions: {
            globals: {
                ...globals.node,
            },
            parserOptions: {
                tsconfigRootDir: __dirname,
            },
        },

        rules: {
            'ban/ban': 'off',
            'no-restricted-properties': defaultRestrictedProperties,
            'n/no-process-env': 'off',
            'no-console': 'off',
            'no-await-in-loop': 'off',
            'no-bitwise': 'off',
        },
    },
    {
        name: 'tag/inject',
        files: ['src/inject/*.ts', 'src/version.ts'],

        languageOptions: {
            parserOptions: {
                tsconfigRootDir: __dirname,
            },
        },

        rules: {
            'n/no-process-env': 'off',
        },
    },
    {
        files: [
            './src/utils/string/*.ts',
            './src/utils/promise/*.ts',
            './src/utils/map/*.ts',
            './src/utils/object/*.ts',
            './src/utils/array/*.ts',
        ],

        languageOptions: {
            parserOptions: {
                tsconfigRootDir: __dirname,
            },
        },

        rules: {
            'no-restricted-properties': defaultRestrictedProperties,
        },
    },
]);
