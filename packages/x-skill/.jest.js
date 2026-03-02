module.exports = {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverage: true,
  coveragePathIgnorePatterns: ['/node_modules/', '/coverage/'],
  coverageProvider: 'v8',
  testTimeout: 10000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: './tsconfig.json',
      },
    ],
  },
  testEnvironmentOptions: {
    nodeOptions: ['--experimental-vm-modules'],
  },
  transformIgnorePatterns: ['node_modules/(?!(get-port|ora|progress)/)'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^ora$': '<rootDir>/__mocks__/ora.js',
    '^progress$': '<rootDir>/__mocks__/progress.js',
  },
  bail: false,
  maxWorkers: '50%',
};
