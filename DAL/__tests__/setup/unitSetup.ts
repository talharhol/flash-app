import { resetUuidCounter } from '../mocks/uuid.mock';

// jest-expo/src/preset/setup.js calls jest.mock('expo-file-system') without
// documentDirectory — override it here (setupFilesAfterEnv runs after setupFiles).
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///test/',
  cacheDirectory: 'file:///test/cache/',
  downloadAsync: jest.fn().mockResolvedValue({ status: 200, uri: 'file:///test/downloaded.png' }),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: false, isDirectory: false, size: 0 }),
  readAsStringAsync: jest.fn().mockResolvedValue(''),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  moveAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  readDirectoryAsync: jest.fn().mockResolvedValue([]),
  createDownloadResumable: jest.fn(),
}));

// alert is a browser global not available in Node — define a no-op so tables.ts
// .catch(alert) handlers don't crash.
(global as any).alert = jest.fn();

// Reset deterministic UUID counter before every test so IDs are predictable.
beforeEach(() => {
  resetUuidCounter();
});
