const sharedMapper = {
  '^expo-sqlite$': '<rootDir>/DAL/__tests__/mocks/expo-sqlite.mock.ts',
  '^expo-file-system$': '<rootDir>/DAL/__tests__/mocks/expo-file-system.mock.ts',
  '^expo-image-manipulator$': '<rootDir>/DAL/__tests__/mocks/expo-image-manipulator.mock.ts',
  '^react-native-uuid$': '<rootDir>/DAL/__tests__/mocks/uuid.mock.ts',
  '^react-native$': '<rootDir>/DAL/__tests__/mocks/react-native.mock.ts',
  'firebaseConfig(\\.js)?$': '<rootDir>/DAL/__tests__/mocks/firebaseConfig.mock.ts',
  '^@/(.*)$': '<rootDir>/$1',
};

const sharedTransformIgnore = [
  'node_modules/(?!(jest-)?react-native|@react-native|expo|@expo|firebase|@firebase)',
];

module.exports = {
  testTimeout: 30000,
  // Integration tests share a single Firestore emulator — run them in one worker
  // to prevent clearFirestore() in one file from wiping docs mid-test in another.
  projects: [
    {
      displayName: 'unit',
      preset: 'jest-expo',
      testMatch: ['<rootDir>/DAL/__tests__/unit/**/*.test.ts'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/DAL/__tests__/setup/unitSetup.ts'],
      moduleNameMapper: sharedMapper,
      transformIgnorePatterns: sharedTransformIgnore,
    },
    {
      displayName: 'integration',
      preset: 'jest-expo',
      testMatch: ['<rootDir>/DAL/__tests__/integration/**/*.test.ts'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/DAL/__tests__/setup/integrationSetup.ts'],
      globalSetup: '<rootDir>/DAL/__tests__/setup/globalSetup.ts',
      globalTeardown: '<rootDir>/DAL/__tests__/setup/globalTeardown.ts',
      moduleNameMapper: sharedMapper,
      transformIgnorePatterns: sharedTransformIgnore,
    },
  ],
};
