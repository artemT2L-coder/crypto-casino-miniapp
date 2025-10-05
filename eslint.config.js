/* eslint-env node */
/* global require, module */


/** @type {import('eslint').Linter.FlatConfig[]} */
const globals = require('globals');

module.exports = [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node, // даём ESLint знать про process/require/module
      },
    },
  },
];
