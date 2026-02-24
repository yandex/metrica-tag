const {
    bannedFunctions,
    bannedProperties,
    defaultRestrictedProperties,
} = require('./eslintBannedFunctions');

/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
    root: true,
    extends: ['prettier', 'plugin:import/recommended'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: './tsconfig.eslint.json',
        ecmaVersion: 2020,
    },
    globals: {
        BigInt: true,
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
        'array-callback-return': ['error', { allowImplicit: true }],
        'block-scoped-var': 'error',
        complexity: ['off', 20],
        'consistent-return': 'error',
        curly: ['error', 'multi-line'], // multiline
        'default-case': ['error', { commentPattern: '^no default$' }],
        'default-case-last': 'error',
        'default-param-last': 'error',
        'dot-location': ['error', 'property'],
        eqeqeq: ['error', 'always', { null: 'ignore' }],
        'grouped-accessor-pairs': 'error',
        'guard-for-in': 'error',
        'max-classes-per-file': ['error', 1],
        'no-alert': 'warn',
        'no-caller': 'error',
        'no-case-declarations': 'error',
        'no-constructor-return': 'error',
        'no-div-regex': 'off',
        'no-else-return': ['error', { allowElseIf: false }],
        'no-empty-pattern': 'error',
        'no-eq-null': 'off',
        'no-eval': 'error',
        'no-extend-native': 'error',
        'no-extra-bind': 'error',
        'no-extra-label': 'error',
        'no-fallthrough': 'error',
        'no-floating-decimal': 'error',
        'no-global-assign': ['error', { exceptions: [] }],
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
        'no-labels': ['error', { allowLoop: false, allowSwitch: false }],
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
        'no-multi-spaces': [
            'error',
            {
                ignoreEOLComments: false,
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
                    'acc', // for reduce accumulators
                    'accumulator', // for reduce accumulators
                    'e', // for e.returnvalue
                    'ctx', // for Koa routing
                    'context', // for Koa routing
                ],
            },
        ],
        'no-proto': 'error',
        'no-redeclare': 'error',
        'no-restricted-properties': defaultRestrictedProperties,
        'no-return-assign': ['error', 'always'],
        'no-return-await': 'error',
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
            { terms: ['todo', 'fixme', 'xxx'], location: 'start' },
        ],
        'no-with': 'error',
        'prefer-promise-reject-errors': ['error', { allowEmptyReject: true }],
        'prefer-named-capture-group': 'off',
        radix: 'error',
        'require-await': 'off',
        'require-unicode-regexp': 'off',
        'vars-on-top': 'error',
        'wrap-iife': ['error', 'outside', { functionPrototypeMethods: false }],
        yoda: 'error',
        'no-empty': ['error', { allowEmptyCatch: true }],
    },
    ignorePatterns: [
        '/_build',
        '/coverage',
        '/hooks',
        'node_modules',
        '!.*', // Check the configs
    ],
    overrides: [
        {
            files: ['*.ts'],
            extends: [
                'plugin:@typescript-eslint/recommended',
                'prettier',
                'prettier/@typescript-eslint',
                'plugin:import/typescript',
            ],
            plugins: ['@typescript-eslint', 'ban', 'n'],
            env: {
                browser: true,
            },
            globals: {
                env: 'readonly',
            },
            rules: {
                'n/no-process-env': 'error',
                'ban/ban': bannedFunctions,
                'no-restricted-properties':
                    defaultRestrictedProperties.concat(bannedProperties),
                '@typescript-eslint/prefer-interface': 'off',
                semi: 'error',
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
                'no-param-reassign': ['error', { props: false }],
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
                    { functions: false },
                ],
            },
        },
        {
            files: ['./generated/**/*'],
            rules: {
                camelcase: 'off',
                '@typescript-eslint/no-use-before-define': 'off',
            },
        },
        {
            files: ['*.spec.ts', '*.spec.js'],
            plugins: ['eslint-plugin-no-only-tests'],
            env: {
                browser: true,
                mocha: true,
            },
            rules: {
                'import/no-extraneous-dependencies': 'off',
                'import/no-named-as-default-member': 'off',
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
            },
        },
        {
            files: './scripts/**/*',
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
            files: ['./src/inject/*.ts', './src/version.ts'],
            rules: {
                'n/no-process-env': 'off',
            },
        },
        {
            files: [
                './src/utils/string/*.ts',
                './src/utils/promise/*.ts',
                './src/utils/object/*.ts',
                './src/utils/array/*.ts',
            ],
            rules: {
                'no-restricted-properties': defaultRestrictedProperties,
            },
        },
    ],
};
