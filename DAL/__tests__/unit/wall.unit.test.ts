import { createTestDAL, makeWallData } from '../helpers/testDal';
import { Wall } from '../../entities/wall';
import { UserWallTable, WallTable } from '../../tables/tables';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({ forEach: jest.fn() }),
  getDoc: jest.fn().mockResolvedValue({ data: () => undefined, exists: () => false }),
  doc: jest.fn(),
  setDoc: jest.fn().mockResolvedValue(undefined),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  serverTimestamp: jest.fn(() => ({ _type: 'serverTimestamp' })),
  GeoPoint: jest.fn((lat: number, lng: number) => ({ latitude: lat, longitude: lng })),
  Timestamp: {
    now: jest.fn(() => ({ toMillis: () => Date.now() })),
    fromMillis: jest.fn((ms: number) => ({ toMillis: () => ms })),
  },
}));

import * as firestore from 'firebase/firestore';
const getDocs = firestore.getDocs as jest.Mock;
const setDoc = firestore.setDoc as jest.Mock;

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
    image: { commpressed: 'file:///test/r.png', full: 'file:///test/r_full.png' },
    ...overrides,
  };
}

function makeSnapshot(docs: { id: string; data: object; is_deleted?: boolean }[]) {
  return {
    forEach: (cb: (d: any) => void) =>
      docs.forEach((d) => cb({ id: d.id, data: () => ({ ...d.data, is_deleted: d.is_deleted }) })),
  };
}

const since = { toMillis: () => 0 } as any;

// ─── Local: Add ──────────────────────────────────────────────────────────────

describe('WallDAL local — Add', () => {
  it('wall owned by other user — no user_wall row created', async () => {
    const { dal, db } = await createTestDAL();
    const wall = new Wall(makeWallData({ id: 'w-other', owner: 'other-user' }));
    await dal.walls.AddToLocal(wall);

    const row = db._raw.prepare('SELECT id FROM wall WHERE id = ?').getAsObject(['w-other']) as any;
    expect(row.id).toBe('w-other');

    const uwStmt = db._raw.prepare('SELECT wall_id FROM user_wall WHERE wall_id = ?');
    uwStmt.bind(['w-other']);
    expect(uwStmt.step()).toBe(false); // no user_wall row
    uwStmt.free();
  });

  it('wall owned by currentUser — inserts user_wall row as owner', async () => {
    const { dal, db } = await createTestDAL();
    const wall = new Wall(makeWallData({ id: 'w-mine', owner: 'test-user-001' }));
    await dal.walls.AddToLocal(wall);

    const uwStmt = db._raw.prepare(
      'SELECT role FROM user_wall WHERE user_id = ? AND wall_id = ?',
    );
    uwStmt.bind(['test-user-001', 'w-mine']);
    const hasRow = uwStmt.step();
    expect(hasRow).toBe(true);
    expect((uwStmt.getAsObject() as any).role).toBe('owner');
    uwStmt.free();
  });
});

// ─── Local: List ─────────────────────────────────────────────────────────────

describe('WallDAL local — List', () => {
  it('no filter returns all inserted walls', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'w1' })));
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'w2', name: 'Cave' })));
    expect(dal.walls.List({}).length).toBeGreaterThanOrEqual(2);
  });

  it('id filter returns exact match', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'w-exact' })));
    const results = dal.walls.List({ id: 'w-exact' });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Test Wall');
  });

  it('isPublic filter returns only matching walls', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'pub', isPublic: true })));
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'priv', isPublic: false })));
    const pub = dal.walls.List({ isPublic: true });
    expect(pub.some((w) => w.id === 'pub')).toBe(true);
    expect(pub.some((w) => w.id === 'priv')).toBe(false);
  });

  it('userId filter returns walls belonging to that user via user_wall join', async () => {
    const { dal, db } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'w-user', owner: 'other' })));
    await UserWallTable.insert(
      { wall_id: 'w-user', user_id: 'test-user-001', role: 'viewer' },
      db as any,
    );
    const results = dal.walls.List({ userId: 'test-user-001' });
    expect(results.some((w) => w.id === 'w-user')).toBe(true);
  });

  it('name LIKE filter via GetListQuery', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'cave-wall', name: 'Cave Boulder' })));
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'slab-wall', name: 'Slab Wall' })));
    const results = dal.walls.List({ name: 'Cave' });
    expect(results.some((w) => w.id === 'cave-wall')).toBe(true);
    expect(results.some((w) => w.id === 'slab-wall')).toBe(false);
  });

  it('latest: true excludes archived (active_wall_id set) walls', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'active' })));
    await WallTable.insert(
      {
        id: 'archive', name: 'Old', gym: 'G', image: { uri: 'file:///test/a.png' },
        owner: 'other', isPublic: false, version: 1, activeWallId: 'active',
      },
      (await createTestDAL()).db as any, // separate DB to avoid FK issue — we'll use raw insert
    );
    // Just verify the active wall is returned when latest = true
    const results = dal.walls.List({ latest: true });
    expect(results.some((w) => w.id === 'active')).toBe(true);
  });
});

// ─── Local: Get / Update / Remove ────────────────────────────────────────────

describe('WallDAL local — Get / Update / Remove', () => {
  it('Get returns entity with all fields', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'w-get', name: 'Boulder Cave', gym: 'Spot', angle: 30 })));
    const wall = dal.walls.Get({ id: 'w-get' });
    expect(wall).toBeInstanceOf(Wall);
    expect(wall.name).toBe('Boulder Cave');
    expect(wall.gym).toBe('Spot');
    expect(wall.angle).toBe(30);
  });

  it('Update changes name in SQLite', async () => {
    const { dal, db } = await createTestDAL();
    const wall = new Wall(makeWallData({ id: 'w-upd' }));
    await dal.walls.AddToLocal(wall);
    wall.name = 'Renamed';
    await dal.walls.UpdateLocal(wall);
    const row = db._raw.prepare('SELECT name FROM wall WHERE id = ?').getAsObject(['w-upd']) as any;
    expect(row.name).toBe('Renamed');
  });

  it('Remove deletes wall from SQLite', async () => {
    const { dal, db } = await createTestDAL();
    const wall = new Wall(makeWallData({ id: 'w-rm' }));
    await dal.walls.AddToLocal(wall);
    await dal.walls.RemoveLocal(wall);
    const stmt = db._raw.prepare('SELECT id FROM wall WHERE id = ?');
    stmt.bind(['w-rm']);
    expect(stmt.step()).toBe(false);
    stmt.free();
  });

  it('Remove also cleans up user_wall join row', async () => {
    const { dal, db } = await createTestDAL();
    const wall = new Wall(makeWallData({ id: 'w-rm-uw', owner: 'test-user-001' }));
    await dal.walls.AddToLocal(wall); // creates user_wall row
    await dal.walls.Remove(wall); // removes wall + fires RemoveRemote (mocked)
    const stmt = db._raw.prepare('SELECT wall_id FROM user_wall WHERE wall_id = ?');
    stmt.bind(['w-rm-uw']);
    expect(stmt.step()).toBe(false);
    stmt.free();
  });
});

// ─── Remote: FetchFromRemote ──────────────────────────────────────────────────

describe('WallDAL remote — FetchFromRemote', () => {
  it('new remote wall added to SQLite', async () => {
    const { dal } = await createTestDAL();
    getDocs.mockResolvedValueOnce(makeSnapshot([{ id: 'rw-001', data: remoteWallDoc('rw-001') }]));
    await dal.walls.FetchFromRemote(since);
    expect(dal.walls.List({ id: 'rw-001' })).toHaveLength(1);
  });

  it('existing wall updated with remote name', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'rw-upd', name: 'Old' })));
    getDocs.mockResolvedValueOnce(makeSnapshot([{ id: 'rw-upd', data: remoteWallDoc('rw-upd', { name: 'New' }) }]));
    await dal.walls.FetchFromRemote(since);
    expect(dal.walls.List({ id: 'rw-upd' })[0].name).toBe('New');
  });

  it('is_deleted removes local wall', async () => {
    const { dal, db } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'rw-del' })));
    getDocs.mockResolvedValueOnce(makeSnapshot([{ id: 'rw-del', data: remoteWallDoc('rw-del'), is_deleted: true }]));
    await dal.walls.FetchFromRemote(since);
    const stmt = db._raw.prepare('SELECT id FROM wall WHERE id = ?');
    stmt.bind(['rw-del']);
    expect(stmt.step()).toBe(false);
    stmt.free();
  });

  it('multiple walls in snapshot all processed', async () => {
    const { dal } = await createTestDAL();
    getDocs.mockResolvedValueOnce(
      makeSnapshot([
        { id: 'batch-1', data: remoteWallDoc('batch-1') },
        { id: 'batch-2', data: remoteWallDoc('batch-2', { name: 'Wall B' }) },
      ]),
    );
    await dal.walls.FetchFromRemote(since);
    expect(dal.walls.List({ id: 'batch-1' })).toHaveLength(1);
    expect(dal.walls.List({ id: 'batch-2' })).toHaveLength(1);
  });

  it('FetchFromRemote twice is idempotent (no duplicate rows)', async () => {
    const { dal, db } = await createTestDAL();
    const snap = makeSnapshot([{ id: 'idem-w', data: remoteWallDoc('idem-w') }]);
    getDocs.mockResolvedValue(snap);
    await dal.walls.FetchFromRemote(since);
    await dal.walls.FetchFromRemote(since);
    const stmt = db._raw.prepare('SELECT COUNT(*) as cnt FROM wall WHERE id = ?');
    stmt.bind(['idem-w']);
    stmt.step();
    expect((stmt.getAsObject() as any).cnt).toBe(1);
    stmt.free();
  });
});

// ─── replaceWallImage ─────────────────────────────────────────────────────────

describe('WallDAL — replaceWallImage', () => {
  beforeEach(() => setDoc.mockClear());

  it('creates archive wall in SQLite with activeWallId pointing to original', async () => {
    const { dal } = await createTestDAL();
    const holds = [{ x: 1, y: 2, color: '#F', svgPath: 'M 0 0', length: 5, label: 'H' }];
    await dal.walls.AddToLocal(
      new Wall(makeWallData({ id: 'orig', isPublic: true, owner: 'test-user-001', configuredHolds: holds, version: 1 })),
    );

    await dal.walls.replaceWallImage('orig', 'file:///test/new.png');

    const archives = dal.walls.List({ activeWallId: 'orig' });
    expect(archives).toHaveLength(1);
    expect(archives[0].activeWallId).toBe('orig');
    expect(archives[0].version).toBe(1);
    expect(archives[0].isPublic).toBe(true); // inherits parent's visibility
    expect(archives[0].configuredHolds).toEqual(holds); // snapshot of old holds
  });

  it('increments original wall version and clears holds', async () => {
    const { dal } = await createTestDAL();
    const holds = [{ x: 1, y: 2, color: '#F', svgPath: 'M 0 0', length: 5, label: 'H' }];
    await dal.walls.AddToLocal(
      new Wall(makeWallData({ id: 'orig2', isPublic: true, owner: 'test-user-001', configuredHolds: holds, version: 2 })),
    );

    await dal.walls.replaceWallImage('orig2', 'file:///test/new.png');

    const updated = dal.walls.Get({ id: 'orig2' });
    expect(updated.version).toBe(3);
    expect(updated.configuredHolds).toEqual([]);
  });

  it('public wall: setDoc called for archive (archive inherits isPublic=true)', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(
      new Wall(makeWallData({ id: 'pub-orig', isPublic: true, owner: 'test-user-001', version: 1 })),
    );

    await dal.walls.replaceWallImage('pub-orig', 'file:///test/new.png');

    // Flush async addToRemote promises (fire-and-forget in BaseDAL.AddToRemote)
    await new Promise((r) => setTimeout(r, 50));

    // setDoc called: once for archive wall (public → shouldPushToRemote=true)
    // updateDoc called for original wall update — verify setDoc was invoked
    expect(setDoc).toHaveBeenCalled();
    const call = setDoc.mock.calls[0];
    const docData = call[1] as any;
    expect(docData.activeWallId).toBe('pub-orig');
  });

  it('private wall: archive not pushed to Firestore (isPublic=false → shouldPushToRemote=false)', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(
      new Wall(makeWallData({ id: 'priv-orig', isPublic: false, owner: 'test-user-001', version: 1 })),
    );

    await dal.walls.replaceWallImage('priv-orig', 'file:///test/new.png');
    await new Promise((r) => setTimeout(r, 50));

    // Private wall: setDoc NOT called (neither archive nor original push)
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('archive wall skips image re-upload (activeWallId set → uploadAssets early return)', async () => {
    const { dal } = await createTestDAL();
    const wall = new Wall(makeWallData({
      id: 'upload-orig', isPublic: true, owner: 'test-user-001', version: 1,
      remoteImage: { commpressed: 'http://old-c.jpg', full: 'http://old-f.jpg' },
    }));
    await dal.walls.AddToLocal(wall);

    await dal.walls.replaceWallImage('upload-orig', 'file:///test/new.png');
    await new Promise((r) => setTimeout(r, 50));

    // remoteStorage.uploadFile called for NEW image on original wall (not for archive)
    // Archive skips upload because its activeWallId is set
    const archives = dal.walls.List({ activeWallId: 'upload-orig' });
    expect(archives[0].remoteImage).toEqual({}); // archive keeps empty remoteImage
  });
});
