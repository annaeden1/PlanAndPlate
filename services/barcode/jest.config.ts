export default {
  preset: 'ts-jest',
  testEnvironment: './jest.environment.js',
  setupFiles: ['./jest.setup.ts'],
  roots: ['<rootDir>/src/tests/'],
};
