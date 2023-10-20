const bannedFunctions = require('./eslintBannedFunctions');

/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
    root: true,
    extends: ['airbnb-base', 'prettier'],
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
        'no-empty': ['error', { allowEmptyCatch: true }],
    },
    ignorePatterns: [
        '/_build',
        '/hooks',
        '/test',
        'node_modules',
        '!.*', // Check the configs
    ],
    overrides: [
        {
            files: ['*.ts'],
            extends: [
                'airbnb-base',
                'plugin:@typescript-eslint/recommended',
                'prettier',
                'prettier/@typescript-eslint',
                'plugin:import/typescript',
            ],
            plugins: ['@typescript-eslint', 'ban'],
            env: {
                browser: true,
            },
            globals: {
                env: 'readonly',
            },
            rules: {
                'ban/ban': bannedFunctions,
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
                'no-empty-function': 'off',
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
                '@typescript-eslint/ban-types': 'off',
                'prefer-rest-params': 'off',
                'prefer-spread': 'off',
                'prefer-object-spread': 'off',
                'prefer-regex-literals': 'off',
                'default-param-last': 'off',
            },
        },
        {
            files: ['./generated/**/*'],
            rules: {
                camelcase: 'off',
                'no-use-before-define': 'off',
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
                'ban/ban': 'off',
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
                'no-console': 'off',
                'no-await-in-loop': 'off',
                'no-bitwise': 'off',
            },
        },
    ],
};
