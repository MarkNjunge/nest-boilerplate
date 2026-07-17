/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".spec.ts$",
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        diagnostics: {
          ignoreCodes: [151001],
        },
      },
    ],
  },
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  setupFiles: ["../e2e-test/util/logging.ts"],
  moduleNameMapper: {
    "@/(.*)": ["<rootDir>/$1"],
  },
  testTimeout: 30000,
}
