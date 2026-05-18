// Override jest-expo's expo-file-system mock (which lacks documentDirectory).
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
(global as any).alert = jest.fn();

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { resetUuidCounter } from '../mocks/uuid.mock';

const APP_NAME = 'test-dal';
const PROJECT_ID = 'demo-flash';
const EMULATOR_HOST = '127.0.0.1';
const EMULATOR_PORT = 8080;

let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;

export function getTestFirestore(): Firestore {
  if (!_db) {
    const existing = getApps().find((a) => a.name === APP_NAME);
    _app = existing ?? initializeApp({ projectId: PROJECT_ID }, APP_NAME);
    _db = getFirestore(_app);
    if (!existing) {
      connectFirestoreEmulator(_db, EMULATOR_HOST, EMULATOR_PORT);
    }
  }
  return _db;
}

export async function clearFirestore(): Promise<void> {
  const res = await fetch(
    `http://${EMULATOR_HOST}:${EMULATOR_PORT}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' },
  );
  if (!res.ok) {
    throw new Error(`clearFirestore failed: ${res.status} ${await res.text()}`);
  }
}

// Reset UUID counter and clear Firestore before every integration test.
beforeEach(async () => {
  resetUuidCounter();
  await clearFirestore();
});
