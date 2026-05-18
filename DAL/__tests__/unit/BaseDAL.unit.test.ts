import { Timestamp } from 'firebase/firestore';
import { createTestDAL, makeWallData, makeProblemData } from '../helpers/testDal';
import { Wall } from '../../entities/wall';
import { Problem } from '../../entities/problem';
import { WallTable, ProblemTable } from '../../tables/tables';

// Mock all firebase/firestore calls so unit tests need no emulator.
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
    now: jest.fn(() => ({ toMillis: () => Date.now(), seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromMillis: jest.fn((ms: number) => ({ toMillis: () => ms, seconds: ms / 1000, nanoseconds: 0 })),
  },
}));

import * as firestore from 'firebase/firestore';
const getDocs = firestore.getDocs as jest.Mock;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeFakeSnapshot(docs: { id: string; data: object; is_deleted?: boolean }[]) {
  return {
    forEach: (cb: (doc: any) => void) => {
      docs.forEach((d) => cb({ id: d.id, data: () => ({ ...d.data, is_deleted: d.is_deleted }) }));
    },
  };
}

// ─── AddToLocal / List / Get ──────────────────────────────────────────────────

describe('BaseDAL — AddToLocal, List, Get', () => {
  it('AddToLocal inserts wall into SQLite', async () => {
    const { dal, db } = await createTestDAL();
    const wall = new Wall(makeWallData({ id: 'w-add-001' }));

    await dal.walls.AddToLocal(wall);

    const rows = db._raw
      .prepare('SELECT id, name FROM wall WHERE id = ?')
      .getAsObject(['w-add-001']);
    expect(rows).toMatchObject({ id: 'w-add-001', name: 'Test Wall' });
  });

  it('AddToLocal calls updateScreen', async () => {
    const { dal } = await createTestDAL();
    const wall = new Wall(makeWallData({ id: 'w-screen' }));
    await dal.walls.AddToLocal(wall);
    expect(dal.updateScreen).toHaveBeenCalled();
  });

  it('List returns inserted entity', async () => {
    const { dal } = await createTestDAL();
    const wall = new Wall(makeWallData({ id: 'w-list-001' }));
    await dal.walls.AddToLocal(wall);

    const results = dal.walls.List({ id: 'w-list-001' });
    expect(results).toHaveLength(1);
    expect(results[0]).toBeInstanceOf(Wall);
    expect(results[0].name).toBe('Test Wall');
  });

  it('List with no params returns all non-deleted rows', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'w-a' })));
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'w-b', name: 'Wall B' })));

    const results = dal.walls.List({});
    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  it('Get returns entity by id', async () => {
    const { dal } = await createTestDAL();
    const wall = new Wall(makeWallData({ id: 'w-get-001' }));
    await dal.walls.AddToLocal(wall);

    const found = dal.walls.Get({ id: 'w-get-001' });
    expect(found).toBeInstanceOf(Wall);
    expect(found.gym).toBe('Test Gym');
  });
});

// ─── UpdateLocal ─────────────────────────────────────────────────────────────

describe('BaseDAL — UpdateLocal', () => {
  it('updates entity fields in SQLite', async () => {
    const { dal, db } = await createTestDAL();
    const wall = new Wall(makeWallData({ id: 'w-upd-001' }));
    await dal.walls.AddToLocal(wall);

    wall.name = 'Renamed Wall';
    await dal.walls.UpdateLocal(wall);

    const row = db._raw
      .prepare('SELECT name FROM wall WHERE id = ?')
      .getAsObject(['w-upd-001']) as any;
    expect(row.name).toBe('Renamed Wall');
  });
});

// ─── RemoveLocal ─────────────────────────────────────────────────────────────

describe('BaseDAL — RemoveLocal', () => {
  it('removes entity from SQLite', async () => {
    const { dal, db } = await createTestDAL();
    const wall = new Wall(makeWallData({ id: 'w-rm-001' }));
    await dal.walls.AddToLocal(wall);
    await dal.walls.RemoveLocal(wall);

    const stmt = db._raw.prepare('SELECT id FROM wall WHERE id = ?');
    stmt.bind(['w-rm-001']);
    expect(stmt.step()).toBe(false);
    stmt.free();
  });
});

// ─── FetchFromRemote ─────────────────────────────────────────────────────────

describe('BaseDAL — FetchFromRemote', () => {
  const since = { toMillis: () => 0, seconds: 0, nanoseconds: 0 } as any;

  it('adds new entity when remote doc has no local counterpart', async () => {
    const { dal } = await createTestDAL();

    getDocs.mockResolvedValueOnce(
      makeFakeSnapshot([
        {
          id: 'remote-wall-001',
          data: {
            id: 'remote-wall-001',
            name: 'Remote Wall',
            gym: 'Remote Gym',
            owner: 'other',
            isPublic: true,
            angle: -1,
            configuredHolds: [],
            version: 1,
            activeWallId: null,
            image: { commpressed: 'file:///test/r.png', full: 'file:///test/r_full.png' },
          },
        },
      ]),
    );

    await dal.walls.FetchFromRemote(since);

    const results = dal.walls.List({ id: 'remote-wall-001' });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Remote Wall');
  });

  it('updates existing entity when remote doc already in local DB', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'upd-wall-001', name: 'Old Name' })));

    getDocs.mockResolvedValueOnce(
      makeFakeSnapshot([
        {
          id: 'upd-wall-001',
          data: {
            id: 'upd-wall-001',
            name: 'Updated Name',
            gym: 'Test Gym',
            owner: 'other',
            isPublic: true,
            angle: -1,
            configuredHolds: [],
            version: 1,
            activeWallId: null,
            image: { commpressed: 'file:///test/w.png', full: 'file:///test/w_full.png' },
          },
        },
      ]),
    );

    await dal.walls.FetchFromRemote(since);

    const results = dal.walls.List({ id: 'upd-wall-001' });
    expect(results[0].name).toBe('Updated Name');
  });

  it('removes local entity when remote doc has is_deleted: true', async () => {
    const { dal, db } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'del-wall-001' })));

    getDocs.mockResolvedValueOnce(
      makeFakeSnapshot([
        {
          id: 'del-wall-001',
          data: { id: 'del-wall-001', name: 'Gone' },
          is_deleted: true,
        },
      ]),
    );

    await dal.walls.FetchFromRemote(since);

    const stmt = db._raw.prepare('SELECT id FROM wall WHERE id = ?');
    stmt.bind(['del-wall-001']);
    expect(stmt.step()).toBe(false);
    stmt.free();
  });

  it('does not crash on malformed remote doc', async () => {
    const { dal } = await createTestDAL();

    getDocs.mockResolvedValueOnce(
      makeFakeSnapshot([{ id: 'bad-doc', data: null as any }]),
    );

    await expect(dal.walls.FetchFromRemote(since)).resolves.not.toThrow();
  });

  it('FetchFromRemote called twice is idempotent — no duplicate rows', async () => {
    const { dal, db } = await createTestDAL();

    const snapshot = makeFakeSnapshot([
      {
        id: 'idem-wall-001',
        data: {
          id: 'idem-wall-001',
          name: 'Idempotent Wall',
          gym: 'G',
          owner: 'other',
          isPublic: true,
          angle: -1,
          configuredHolds: [],
          version: 1,
          activeWallId: null,
          image: { commpressed: 'file:///test/i.png', full: 'file:///test/i_full.png' },
        },
      },
    ]);
    getDocs.mockResolvedValue(snapshot);

    await dal.walls.FetchFromRemote(since);
    await dal.walls.FetchFromRemote(since);

    const stmt = db._raw.prepare('SELECT COUNT(*) as cnt FROM wall WHERE id = ?');
    stmt.bind(['idem-wall-001']);
    stmt.step();
    expect(stmt.getAsObject().cnt).toBe(1);
    stmt.free();
  });
});

// ─── Problem — JSON holds preserved through full DAL roundtrip ────────────────

describe('ProblemDAL — holds JSON roundtrip', () => {
  it('stores and retrieves holds through AddToLocal + List', async () => {
    const { dal } = await createTestDAL();

    // Seed required FK: wall row.
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-001' })));

    const holds = [
      { x: 5, y: 15, color: '#123456', svgPath: 'M 0 0', length: 10, label: 'S' },
    ];
    const prob = new Problem(makeProblemData({ id: 'prob-001', holds, wallId: 'wall-001' }));
    await dal.problems.AddToLocal(prob);

    const results = dal.problems.List({ id: 'prob-001' });
    expect(results[0].holds).toEqual(holds);
  });
});
