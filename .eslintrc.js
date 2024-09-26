/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

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
    'no-console': 'off',
    'no-underscore-dangle': 'off',
    'max-len': ['error', { code: 160, ignoreComments: true }],
  },
};
