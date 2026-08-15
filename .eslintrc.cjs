/**
 * ESLint config. Set ESLINT_CI_LIGHT=1 to skip TypeScript program creation
 * (parserOptions.project + TS import resolver). Required on GitHub-hosted
 * runners (~7GB RAM): type-aware parsing alone can OOM even with path shards.
 */
const isCiLight = process.env.ESLINT_CI_LIGHT === "1";

/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:jsx-a11y/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
    ...(isCiLight ? {} : { project: "./tsconfig.json" }),
  },
  plugins: ["@typescript-eslint", "import", "jsx-a11y"],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "import/order": [
      "error",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
        ],
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
      },
    ],
    "import/no-unresolved": "error",
    "import/no-named-as-default": "off",
    "import/no-named-as-default-member": "off",
    "@next/next/no-img-element": "off",
    "react-hooks/exhaustive-deps": "off",
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
  },
  settings: {
    "import/resolver": isCiLight
      ? {
          node: {
            extensions: [".js", ".jsx", ".ts", ".tsx"],
          },
        }
      : {
          typescript: {
            alwaysTryTypes: true,
            project: "./tsconfig.json",
          },
          node: {
            extensions: [".js", ".jsx", ".ts", ".tsx"],
          },
        },
  },
  ignorePatterns: [
    "node_modules/",
    ".next/",
    ".next/types/**",
    "out/",
    "build/",
    "dist/",
    "*.config.js",
    "*.config.ts",
    "next-env.d.ts",
  ],
};
