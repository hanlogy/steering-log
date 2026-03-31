import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: [],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  testMatch: ['**/__test__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/test/(.*)$': '<rootDir>/__test__/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;
