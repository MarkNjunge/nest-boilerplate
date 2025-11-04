import js from "@eslint/js";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";
import markConfig from "@marknjunge/eslint-config-ts";

export default defineConfig([
  globalIgnores(["src/db/migrations/*"]),
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], plugins: { js }, extends: ["js/recommended"] },
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], languageOptions: { globals: globals.node } },
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    plugins: { js },
    extends: [markConfig],
    rules: {
      "@stylistic/lines-between-class-members": "off",
      "@typescript-eslint/prefer-regexp-exec": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@stylistic/operator-linebreak": ["warn", "after", {
        overrides: { "|": "before" }
      }]
    }
  },
]);
