module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "@stylistic"],
  extends: ["@marknjunge/eslint-config-ts"],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  overrides: [
    {
      files: ["*.js"],
      extends: ["plugin:@typescript-eslint/disable-type-checked"],
    }
  ],
  rules: {
    // Specific to nest
    // "@typescript-eslint/class-literal-property-style": "Off",
    "@stylistic/lines-between-class-members": "off" // Doesn't work well with decorators
  },
};
