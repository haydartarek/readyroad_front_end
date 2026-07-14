// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jest-environment-jsdom",

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  testRegex: ["[/\\\\]src[/\\\\].*(?:\\.test|\\.spec)\\.[jt]sx?$"],
  testPathIgnorePatterns: ["/node_modules/", "/tests/e2e/"],
  modulePathIgnorePatterns: ["<rootDir>/.next/"],

  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{js,jsx,ts,tsx}",
  ],
};

module.exports = createJestConfig(customJestConfig);
