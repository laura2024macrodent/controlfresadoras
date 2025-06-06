import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.browser,
        process: "readonly",
        __dirname: "readonly",
      },
      parserOptions: {
        ecmaVersion: 12,
        sourceType: "module",
      },
    },
  },
  pluginJs.configs.recommended,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        ecmaVersion: 12,
        sourceType: "module",
      },
    },
  },
];