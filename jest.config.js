module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  reporters: ['default', 'jest-junit'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};
