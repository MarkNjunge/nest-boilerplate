module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint/eslint-plugin"],
  extends: [
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "@marknjunge/eslint-config-ts",
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  rules: {
    "padding-line-between-statements": "off",
    "@typescript-eslint/indent": "off",
    "@typescript-eslint/no-unnecessary-condition": "off",
  },
};
