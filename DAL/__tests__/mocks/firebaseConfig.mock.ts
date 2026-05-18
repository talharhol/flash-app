// Blocks firebaseConfig.js from loading initializeAuth with RN AsyncStorage,
// which crashes in the Node test environment.
// Integration tests inject a real emulator Firestore via the mock IDAL directly.

export const app = {} as any;
export const db = {} as any;
export const auth = {
  currentUser: null,
  onAuthStateChanged: jest.fn((cb: any) => { cb(null); return jest.fn(); }),
  signOut: jest.fn().mockResolvedValue(undefined),
} as any;
