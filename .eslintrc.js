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
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-argument": "off",
    "@typescript-eslint/restrict-template-expressions": ["error", { allowAny: true }],
    "eqeqeq": "off",
    "@typescript-eslint/no-unsafe-return": "off",
    "padding-line-between-statements": "off",
    "@typescript-eslint/indent": "off",
    "@typescript-eslint/no-unnecessary-condition": "off",
    "@typescript-eslint/strict-boolean-expressions": "off",
    "@typescript-eslint/require-await": "off",
    "@typescript-eslint/lines-between-class-members": "off"
  },
};
