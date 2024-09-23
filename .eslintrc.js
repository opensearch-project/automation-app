module.exports = {
  env: {
    browser: false,
    es6: true,
    jest: true,
  },
  extends: ['airbnb-base', 'airbnb-typescript/base'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    hasTrailingComma: 'off',
    indent: ['error', 2],
    'no-tabs': 'error',
    'import/extensions': 'error',
    'import/no-namespace': 'error',
    'import/no-unresolved': 'error',
    'import/no-extraneous-dependencies': 'error',
    'import/prefer-default-export': 'off',
    'max-classes-per-file': 'off',
    'no-new': 'off',
    "no-console": "off",
    'max-len': ['error', { code: 120, ignoreComments: true }],
  },
};
