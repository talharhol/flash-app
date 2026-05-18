import { createTestDAL, makeWallData } from '../helpers/testDal';
import { Wall } from '../../entities/wall';
import { UserWallTable, GroupMemberTable, GroupTable, UserTable } from '../../tables/tables';

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
  GeoPoint: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toMillis: () => Date.now() })),
    fromMillis: jest.fn((ms: number) => ({ toMillis: () => ms })),
  },
}));

import * as firestore from 'firebase/firestore';
const getDocs = firestore.getDocs as jest.Mock;

const since = { toMillis: () => 0 } as any;

// ─── Local: AddWall / RemoveWall / GetWalls ───────────────────────────────────

describe('UserDAL local — wall management', () => {
  it('AddWall inserts user_wall row with correct role', async () => {
    const { dal, db } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-aw' })));
    await dal.users.AddWall({ wall_id: 'wall-aw', user_id: 'test-user-001' }, 'owner');
    const stmt = db._raw.prepare(
      'SELECT role FROM user_wall WHERE user_id = ? AND wall_id = ?',
    );
    stmt.bind(['test-user-001', 'wall-aw']);
    expect(stmt.step()).toBe(true);
    expect((stmt.getAsObject() as any).role).toBe('owner');
    stmt.free();
  });

  it('AddWall is idempotent — second call produces no duplicate', async () => {
    const { dal, db } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-idem' })));
    await dal.users.AddWall({ wall_id: 'wall-idem', user_id: 'test-user-001' }, 'viewer');
    await dal.users.AddWall({ wall_id: 'wall-idem', user_id: 'test-user-001' }, 'viewer');
    const stmt = db._raw.prepare(
      'SELECT COUNT(*) as cnt FROM user_wall WHERE user_id = ? AND wall_id = ?',
    );
    stmt.bind(['test-user-001', 'wall-idem']);
    stmt.step();
    expect((stmt.getAsObject() as any).cnt).toBe(1);
    stmt.free();
  });

  it('RemoveWall removes viewer user_wall row', async () => {
    const { dal, db } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-rv' })));
    await UserWallTable.insert(
      { wall_id: 'wall-rv', user_id: 'test-user-001', role: 'viewer' },
      db as any,
    );
    await dal.users.RemoveWall({ wall_id: 'wall-rv', user_id: 'test-user-001' });
    const stmt = db._raw.prepare(
      'SELECT wall_id FROM user_wall WHERE user_id = ? AND wall_id = ?',
    );
    stmt.bind(['test-user-001', 'wall-rv']);
    expect(stmt.step()).toBe(false);
    stmt.free();
  });

  it('GetWalls returns walls linked via user_wall', async () => {
    const { dal, db } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-gw' })));
    await UserWallTable.insert(
      { wall_id: 'wall-gw', user_id: 'test-user-001', role: 'viewer' },
      db as any,
    );
    const walls = dal.users.GetWalls({ user_id: 'test-user-001', latest: false });
    expect(walls.some((w: any) => w.id === 'wall-gw')).toBe(true);
  });

  it('GetWalls with role filter returns only matching role', async () => {
    const { dal, db } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'owned-wall' })));
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'viewed-wall', name: 'Viewed' })));
    await UserWallTable.insert({ wall_id: 'owned-wall', user_id: 'test-user-001', role: 'owner' }, db as any);
    await UserWallTable.insert({ wall_id: 'viewed-wall', user_id: 'test-user-001', role: 'viewer' }, db as any);
    const owned = dal.users.GetWalls({ user_id: 'test-user-001', role: 'owner', latest: false });
    expect(owned.some((w: any) => w.id === 'owned-wall')).toBe(true);
    expect(owned.some((w: any) => w.id === 'viewed-wall')).toBe(false);
  });
});

// ─── Local: List users ────────────────────────────────────────────────────────

describe('UserDAL local — List', () => {
  it('List({id}) returns matching user', async () => {
    const { dal } = await createTestDAL(); // creates test-user-001 via seedUser
    const results = dal.users.List({ id: 'test-user-001' });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Test User');
  });

  it('List({groupId}) returns only members of that group', async () => {
    const { dal, db } = await createTestDAL();
    await UserTable.insert({ id: 'user-2', name: 'User Two' }, db as any);
    await UserTable.insert({ id: 'user-3', name: 'User Three' }, db as any);
    await GroupTable.insert({ id: 'grp-1', name: 'Group', image: { uri: 'file:///test/g.png' } }, db as any);
    await GroupMemberTable.insert({ user_id: 'test-user-001', group_id: 'grp-1', role: 'admin' }, db as any);
    await GroupMemberTable.insert({ user_id: 'user-2', group_id: 'grp-1', role: 'member' }, db as any);

    const results = dal.users.List({ groupId: 'grp-1' });
    const ids = results.map((u: any) => u.id);
    expect(ids).toContain('test-user-001');
    expect(ids).toContain('user-2');
    expect(ids).not.toContain('user-3');
  });
});

// ─── Local: config fields ─────────────────────────────────────────────────────

describe('UserDAL local — config fields', () => {
  it('getLastPulled returns 0 for fresh user config', async () => {
    const { dal } = await createTestDAL();
    const user = dal.users.List({ id: 'test-user-001' })[0];
    expect(dal.users.getLastPulled(user)).toBe(0);
  });

  it('setLastPulled / getLastPulled roundtrip', async () => {
    const { dal } = await createTestDAL();
    const user = dal.users.List({ id: 'test-user-001' })[0];
    await dal.users.setLastPulled(user, 1716000000000);
    expect(dal.users.getLastPulled(user)).toBe(1716000000000);
  });

  it('getShouldFetchUserData returns falsy by default', async () => {
    const { dal } = await createTestDAL();
    const user = dal.users.List({ id: 'test-user-001' })[0];
    expect(dal.users.getShouldFetchUserData(user)).toBeFalsy();
  });

  it('setShouldFetchUserData / getShouldFetchUserData roundtrip', async () => {
    const { dal } = await createTestDAL();
    const user = dal.users.List({ id: 'test-user-001' })[0];
    await dal.users.setShouldFetchUserData(user, true);
    // SQLite stores booleans as 0/1 — use toBeTruthy not toBe(true)
    expect(dal.users.getShouldFetchUserData(user)).toBeTruthy();
  });

  it('getFilters returns empty object by default', async () => {
    const { dal } = await createTestDAL();
    const user = dal.users.List({ id: 'test-user-001' })[0];
    expect(dal.users.getFilters(user)).toEqual({});
  });

  it('setFilters / getFilters roundtrip (JSON serialized)', async () => {
    const { dal } = await createTestDAL();
    const user = dal.users.List({ id: 'test-user-001' })[0];
    const filters = {
      'wall-001': { minGrade: 3, maxGrade: 10, name: 'crimpy', setters: ['u1'], isPublic: true },
    };
    await dal.users.setFilters(user, filters);
    const loaded = dal.users.getFilters(user);
    expect(loaded['wall-001'].minGrade).toBe(3);
    expect(loaded['wall-001'].name).toBe('crimpy');
  });

  it('getLoginCount returns 0 by default', async () => {
    const { dal } = await createTestDAL();
    const user = dal.users.List({ id: 'test-user-001' })[0];
    expect(dal.users.getLoginCount(user)).toBe(0);
  });

  it('setLoginCount increments correctly', async () => {
    const { dal } = await createTestDAL();
    const user = dal.users.List({ id: 'test-user-001' })[0];
    await dal.users.setLoginCount(user, 5);
    expect(dal.users.getLoginCount(user)).toBe(5);
  });
});

// ─── Remote: FetchFromRemote ──────────────────────────────────────────────────

describe('UserDAL remote — FetchFromRemote', () => {
  it('new remote user added to SQLite', async () => {
    const { dal } = await createTestDAL();
    getDocs.mockResolvedValueOnce({
      forEach: (cb: any) =>
        cb({
          id: 'remote-user-002',
          data: () => ({
            id: 'remote-user-002',
            name: 'Remote User',
            image: { commpressed: '', full: '' },
          }),
        }),
    });
    await dal.users.FetchFromRemote(since);
    expect(dal.users.List({ id: 'remote-user-002' })).toHaveLength(1);
    expect(dal.users.List({ id: 'remote-user-002' })[0].name).toBe('Remote User');
  });

  it('existing user name updated from remote', async () => {
    const { dal } = await createTestDAL();
    getDocs.mockResolvedValueOnce({
      forEach: (cb: any) =>
        cb({
          id: 'test-user-001',
          data: () => ({
            id: 'test-user-001',
            name: 'Updated Name',
            image: { commpressed: '', full: '' },
          }),
        }),
    });
    await dal.users.FetchFromRemote(since);
    expect(dal.users.List({ id: 'test-user-001' })[0].name).toBe('Updated Name');
  });
});
