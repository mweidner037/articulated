import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    "**/build/",
    "**/docs/",
    "**/coverage/",
    "**/*.js",
    "**/*.cjs",
    "**/*.mjs",
  ]),
  {
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      eslintConfigPrettier,
    ],
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      // Allow inference in function return type.
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      // Allow non-null assertions.
      "@typescript-eslint/no-non-null-assertion": "off",
      // Allow implicit string casts in template literals.
      "@typescript-eslint/restrict-template-expressions": "off",
      // Allow ts-expect-error with justification.
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
        },
      ],
      // Allow unused parameter names that start with _, like TypeScript does.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "all",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
]);
