module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'], // Points to 'test' directory where your test files live
  testMatch: ['**/*.test.ts'], // Match test files ending with `.test.ts`
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};
