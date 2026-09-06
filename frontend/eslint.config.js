import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettierConfig from "eslint-config-prettier";
import prettier from "eslint-plugin-prettier";
import react from "eslint-plugin-react";

export default [
  {
    ignores: ["node_modules/**", "src-tauri/**", "dist/**"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: false,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      prettier,
      react,
    },
    rules: {
      ...prettierConfig.rules,
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      quotes: ["error", "double"],
      "comma-dangle": ["error", "always-multiline"],
      "arrow-parens": ["error", "always"],
      "prettier/prettier": "error",
      "react/jsx-key": "error",
    },
  },
];
