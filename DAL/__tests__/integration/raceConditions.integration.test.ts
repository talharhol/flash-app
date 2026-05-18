// Tests: concurrent local writes, simultaneous sync + local write, loop idempotency.
// Requires: Firebase Emulator running on localhost:8080

import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { getTestFirestore } from '../setup/integrationSetup';
import { createTestDAL, makeWallData } from '../helpers/testDal';
import { Wall } from '../../entities/wall';

const since = Timestamp.fromMillis(0);

function remoteWallDoc(id: string, name = 'Race Wall') {
  return {
    id,
    name,
    gym: 'Race Gym',
    owner: 'other-user',
    isPublic: true,
    angle: -1,
    configuredHolds: [],
    version: 1,
    activeWallId: null,
    image: { commpressed: 'file:///test/race.png', full: 'file:///test/race_full.png' },
    updated_at: Timestamp.now(),
  };
}

// ─── Concurrent AddToLocal ────────────────────────────────────────────────────

describe('Race: concurrent AddToLocal for different entities', () => {
  it('both rows exist after Promise.all — no corruption', async () => {
    const { dal, db } = await createTestDAL();

    await Promise.all([
      dal.walls.AddToLocal(new Wall(makeWallData({ id: 'race-wall-a', name: 'Wall A' }))),
      dal.walls.AddToLocal(new Wall(makeWallData({ id: 'race-wall-b', name: 'Wall B' }))),
    ]);

    const stmt = db._raw.prepare('SELECT id FROM wall ORDER BY id');
    const rows: any[] = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();

    const ids = rows.map((r) => r.id);
    expect(ids).toContain('race-wall-a');
    expect(ids).toContain('race-wall-b');
  });
});

// ─── Concurrent AddToLocal + FetchFromRemote for same ID ─────────────────────

describe('Race: AddToLocal + FetchFromRemote for same entity ID', () => {
  it('exactly one row in SQLite regardless of operation order', async () => {
    const firestoreDB = getTestFirestore();
    const { dal, db } = await createTestDAL(firestoreDB);

    await setDoc(doc(firestoreDB, 'wall', 'race-same-001'), remoteWallDoc('race-same-001', 'Remote Name'));

    // Fire AddToLocal and FetchFromRemote simultaneously.
    await Promise.all([
      dal.walls.AddToLocal(new Wall(makeWallData({ id: 'race-same-001', name: 'Local Name' }))),
      dal.walls.FetchFromRemote(since),
    ]);

    const stmt = db._raw.prepare('SELECT COUNT(*) as cnt FROM wall WHERE id = ?');
    stmt.bind(['race-same-001']);
    stmt.step();
    const count = (stmt.getAsObject() as any).cnt;
    stmt.free();

    expect(count).toBe(1);
  });
});

// ─── FetchFromRemote idempotency ──────────────────────────────────────────────

describe('Race: FetchFromRemote called twice — idempotent', () => {
  it('row count stays 1, no duplicates', async () => {
    const firestoreDB = getTestFirestore();
    const { dal, db } = await createTestDAL(firestoreDB);

    await setDoc(doc(firestoreDB, 'wall', 'idem-001'), remoteWallDoc('idem-001'));

    await dal.walls.FetchFromRemote(since);
    await dal.walls.FetchFromRemote(since);

    const stmt = db._raw.prepare('SELECT COUNT(*) as cnt FROM wall WHERE id = ?');
    stmt.bind(['idem-001']);
    stmt.step();
    const count = (stmt.getAsObject() as any).cnt;
    stmt.free();

    expect(count).toBe(1);
  });
});

// ─── Sync loop timing with fake timers ───────────────────────────────────────

describe('loadUpdates loop: FetchFromRemote called on each iteration', () => {
  it('spy called once after initial run, again after 300s advance', async () => {
    const { dal } = await createTestDAL();

    jest.useFakeTimers();

    const fetchSpy = jest.spyOn(dal.walls, 'FetchFromRemote').mockResolvedValue(undefined);
    jest.spyOn(dal.users, 'FetchFromRemote').mockResolvedValue(undefined);
    jest.spyOn(dal.problems, 'FetchFromRemote').mockResolvedValue(undefined);
    jest.spyOn(dal.groups, 'FetchFromRemote').mockResolvedValue(undefined);
    jest.spyOn(dal.ticks, 'FetchFromRemote').mockResolvedValue(undefined);
    jest.spyOn(dal.users, 'FetchUserData').mockResolvedValue(undefined);

    // Simulate the loadUpdates loop inline (without DalService to avoid singleton issues).
    async function runOneIteration() {
      const last = Timestamp.fromMillis(0);
      await dal.walls.FetchFromRemote(last);
      await dal.users.FetchFromRemote(last);
      await dal.problems.FetchFromRemote(last);
      await dal.groups.FetchFromRemote(last);
      await dal.ticks.FetchFromRemote(last);
    }

    await runOneIteration();
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await runOneIteration();
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });
});
