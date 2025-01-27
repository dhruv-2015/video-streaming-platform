// @ts-check

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:security/recommended',
    'plugin:node/recommended'
  ],
  plugins: ['@typescript-eslint', 'security', 'node'],
  parser: '@typescript-eslint/parser',
  env: {
    node: true,
    commonjs: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'commonjs'
  },
  rules: {
    // Express specific rules
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-non-literal-require': 'warn',
    'security/detect-pseudoRandomBytes': 'warn',

    // CommonJS specific rules
    'node/exports-style': ['error', 'module.exports'],
    'node/no-unsupported-features/es-syntax': ['error', {
      'ignores': ['modules']
    }],
    'node/no-missing-require': 'error',

    // Best practices
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-return-await': 'error',
    'require-await': 'error',
    'no-promise-executor-return': 'error',
    'max-nested-callbacks': ['error', 3],
    'no-buffer-constructor': 'error',
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: ['./tsconfig.json'],
      },
    },
    node: {
      tryExtensions: ['.js', '.json', '.node', '.ts']
    }
  },
};
