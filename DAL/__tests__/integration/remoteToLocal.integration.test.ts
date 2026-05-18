// Tests: seed Firestore, call FetchFromRemote, verify correct local SQLite state.
// Requires: Firebase Emulator running on localhost:8080

import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { getTestFirestore } from '../setup/integrationSetup';
import { createTestDAL, makeWallData } from '../helpers/testDal';
import { Wall } from '../../entities/wall';

const since = Timestamp.fromMillis(0);

function remoteWallDoc(id: string, overrides: Partial<any> = {}) {
  return {
    id,
    name: 'Remote Wall',
    gym: 'Remote Gym',
    owner: 'other-user',
    isPublic: true,
    angle: -1,
    configuredHolds: [],
    version: 1,
    activeWallId: null,
    image: { commpressed: 'file:///test/remote.png', full: 'file:///test/remote_full.png' },
    updated_at: Timestamp.now(),
    ...overrides,
  };
}

describe('Remote → Local: new document', () => {
  it('FetchFromRemote pulls new Firestore doc into SQLite', async () => {
    const firestoreDB = getTestFirestore();
    const { dal, db } = await createTestDAL(firestoreDB);

    await setDoc(doc(firestoreDB, 'wall', 'rtl-wall-001'), remoteWallDoc('rtl-wall-001'));

    await dal.walls.FetchFromRemote(since);

    const results = dal.walls.List({ id: 'rtl-wall-001' });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Remote Wall');
    expect(results[0].gym).toBe('Remote Gym');

    // Also verify the raw row is in SQLite.
    const sqlRow = db._raw
      .prepare('SELECT id, name FROM wall WHERE id = ?')
      .getAsObject(['rtl-wall-001']) as any;
    expect(sqlRow.id).toBe('rtl-wall-001');
  });
});

describe('Remote → Local: updated document', () => {
  it('FetchFromRemote updates local row when remote has newer data', async () => {
    const firestoreDB = getTestFirestore();
    const { dal } = await createTestDAL(firestoreDB);

    // Seed old version locally.
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'rtl-wall-upd', name: 'Old Name' })));

    // Seed newer version in Firestore.
    await setDoc(
      doc(firestoreDB, 'wall', 'rtl-wall-upd'),
      remoteWallDoc('rtl-wall-upd', { name: 'New Name' }),
    );

    await dal.walls.FetchFromRemote(since);

    const results = dal.walls.List({ id: 'rtl-wall-upd' });
    expect(results[0].name).toBe('New Name');
  });
});

describe('Remote → Local: deleted document', () => {
  it('FetchFromRemote removes local row when remote has is_deleted: true', async () => {
    const firestoreDB = getTestFirestore();
    const { dal, db } = await createTestDAL(firestoreDB);

    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'rtl-wall-del' })));

    await setDoc(
      doc(firestoreDB, 'wall', 'rtl-wall-del'),
      { ...remoteWallDoc('rtl-wall-del'), is_deleted: true },
    );

    await dal.walls.FetchFromRemote(since);

    const stmt = db._raw.prepare('SELECT id FROM wall WHERE id = ?');
    stmt.bind(['rtl-wall-del']);
    expect(stmt.step()).toBe(false);
    stmt.free();
  });
});

describe('Remote → Local: updated_at timestamp', () => {
  it('Firestore doc updated_at is a server-side Timestamp, not a JS number', async () => {
    const firestoreDB = getTestFirestore();
    const { dal } = await createTestDAL(firestoreDB);

    const wall = new Wall(makeWallData({ id: 'rtl-wall-ts', isPublic: true }));
    wall.remoteImage = { commpressed: 'file:///test/ts.png', full: 'file:///test/ts_full.png' };
    jest.spyOn(wall as any, 'uploadAssets').mockResolvedValue(wall.toRemoteDoc());
    wall.setDAL(dal);

    await dal.walls.AddToLocal(wall);
    await wall.addToRemote('wall');

    const snap = await getDoc(doc(firestoreDB, 'wall', 'rtl-wall-ts'));
    const ts = snap.data()!.updated_at;

    // serverTimestamp() writes a Firestore Timestamp object, not a plain number.
    expect(ts).toBeDefined();
    expect(typeof ts).toBe('object');
    expect(typeof ts.toMillis).toBe('function');
    expect(ts.toMillis()).toBeGreaterThan(Date.now() - 10_000);
  });
});
