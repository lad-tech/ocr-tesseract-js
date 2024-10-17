import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testResultsProcessor: 'jest-sonar-reporter',
  coverageReporters: ['lcov', 'json-summary'],
  collectCoverage: true,
  verbose: true,
};

export default config;
