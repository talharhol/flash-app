# DAL Unit & Integration Tests

## Commands

```bash
npm run test:unit           # unit tests — no emulator, runs offline
npm run test:integration    # integration tests — requires emulator running
npm run test:dal            # both
npm run test:dal:watch      # unit tests in watch mode
```

Integration tests require the Firebase emulator (uses `demo-flash` project, no real Firebase needed):
```bash
npm run emulator:start      # Terminal 1
npm run test:integration    # Terminal 2
```

## Architecture

Three test layers, all Node-only (no phone, no Android emulator):

| Layer | Firebase | SQLite | Speed |
|-------|----------|--------|-------|
| Unit | `jest.mock('firebase/firestore')` | sql-asm.js in-memory | Fast |
| Integration | Real emulator :8080 | sql-asm.js in-memory | Slow |
| Race | Real emulator :8080 | sql-asm.js in-memory | Slow |

`expo-sqlite` is replaced by a `sql-asm.js` shim (`DAL/__tests__/mocks/expo-sqlite.mock.ts`) that mirrors the exact surface expo-sqlite exposes to `BaseTable` and `Query`. No native compilation needed.

## File Structure

```
DAL/__tests__/
├── unit/
│   ├── BaseTable.unit.test.ts   # insert/query/update/delete, field serialization, Query builder
│   └── BaseDAL.unit.test.ts     # AddToLocal, List, Get, UpdateLocal, RemoveLocal, FetchFromRemote
├── integration/
│   ├── localToRemote.integration.test.ts   # write local → verify Firestore doc
│   ├── remoteToLocal.integration.test.ts   # seed Firestore → FetchFromRemote → verify SQLite
│   └── raceConditions.integration.test.ts  # concurrent ops, idempotency, sync loop spy
├── mocks/
│   ├── expo-sqlite.mock.ts      # sql-asm.js shim (critical — mirrors expo-sqlite API)
│   ├── expo-file-system.mock.ts # documentDirectory = 'file:///test/' so image dumpers skip copy
│   ├── expo-image-manipulator.mock.ts
│   ├── firebaseConfig.mock.ts   # blocks initializeAuth(AsyncStorage) crash in Node
│   ├── react-native.mock.ts     # Image.resolveAssetSource passthrough
│   └── uuid.mock.ts             # deterministic counter-based IDs, reset in beforeEach
├── setup/
│   ├── schema.ts                # createTestDatabase() — creates all tables in FK order
│   ├── unitSetup.ts             # re-mocks expo-file-system (overrides jest-expo preset), global.alert
│   ├── integrationSetup.ts      # Firebase emulator connection, clearFirestore() in beforeEach
│   ├── globalSetup.ts           # emulator health check before integration suites
│   └── globalTeardown.ts
└── helpers/
    └── testDal.ts               # createTestDAL() — builds IDAL-compatible mock without DalService
```

## Key Design Decisions

### Why not DalService in tests
`DalService` is a singleton that on construction: (1) imports `firebaseConfig.js` which calls `initializeAuth(AsyncStorage)` — crashes in Node, (2) fires `loadUpdates()` — an infinite loop. Tests construct DAL objects directly via `createTestDAL()` which injects a mock IDAL.

### expo-file-system mock placement
`jest-expo/src/preset/setup.js` (line 132) calls `jest.mock('expo-file-system', ...)` without `documentDirectory`. This runs as `setupFiles` and would shadow `moduleNameMapper`. The fix: re-mock in `setupFilesAfterEnv` (`unitSetup.ts`, `integrationSetup.ts`) which runs after `setupFiles`.

### Image URI convention in tests
Pass `image: { uri: 'file:///test/something.png' }` for all test wall/group data. The `convertToLocalImage` dumper in `tables.ts` checks `imageSrc.uri.startsWith(FileSystem.documentDirectory)`. Our mock sets `documentDirectory = 'file:///test/'`, so the URI matches and the file copy is skipped.

### Firestore clearing between integration tests
Uses the Firebase Emulator REST API — no `@firebase/rules-unit-testing` needed (avoids firebase version pin conflict):
```
DELETE http://127.0.0.1:8080/emulator/v1/projects/demo-flash/databases/(default)/documents
```
Called in `beforeEach` via `clearFirestore()` from `integrationSetup.ts`.

### sql-asm.js shim — undefined → null
sql.js throws on `undefined` bind parameters. The shim maps `undefined → null` in `runAsync` because `deleted_at` field has `default_: () => undefined` which maps to SQL NULL.

### FetchFromRemote test data shape
`Wall.fromRemoteDoc` reads `data.image.commpressed`. Fake snapshots must include:
```typescript
image: { commpressed: 'file:///test/w.png', full: 'file:///test/w_full.png' }
```

### WallDAL.AddToLocal side-effect
When `wall.owner === dal.currentUser.id`, `AddToLocal` also inserts into `user_wall`. Avoid by setting `owner: 'other-user'` in test wall data (the default in `makeWallData()`).

## Adding New Tests

**Unit test for a new DAL method:**
```typescript
import { createTestDAL, makeWallData } from '../helpers/testDal';
jest.mock('firebase/firestore', () => ({ /* stubs */ }));

it('...', async () => {
  const { dal, db } = await createTestDAL();
  // use dal.walls / dal.problems / dal.groups / dal.ticks
  // use db._raw.prepare(sql).getAsObject([args]) for raw assertions
});
```

**Integration test:**
```typescript
import { getTestFirestore } from '../setup/integrationSetup';
import { doc, setDoc, getDoc } from 'firebase/firestore';

it('...', async () => {
  const firestoreDB = getTestFirestore();
  const { dal, db } = await createTestDAL(firestoreDB);
  // clearFirestore() runs automatically in beforeEach
});
```
