// Edge cases across all DAL entities and operations.

import { createTestDAL, makeWallData, makeProblemData } from '../helpers/testDal';
import { Wall } from '../../entities/wall';
import { Problem } from '../../entities/problem';
import { Group } from '../../entities/group';
import { UserTick } from '../../entities/userTick';
import { User } from '../../entities/user';
import {
  UserTable, UserWallTable, WallTable, GroupTable,
  GroupMemberTable, GroupWallTable, GroupProblemTable,
  ProblemTable, UserConfigTable,
} from '../../tables/tables';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  and: jest.fn(),
  or: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({ forEach: jest.fn(), docs: [] }),
  getDoc: jest.fn().mockResolvedValue({ data: () => undefined, exists: () => false }),
  doc: jest.fn(),
  setDoc: jest.fn().mockResolvedValue(undefined),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  arrayUnion: jest.fn((...a: any[]) => ({ _union: a })),
  arrayRemove: jest.fn((...a: any[]) => ({ _remove: a })),
  serverTimestamp: jest.fn(() => ({ _type: 'serverTimestamp' })),
  GeoPoint: jest.fn((lat: number, lng: number) => ({ latitude: lat, longitude: lng })),
  Timestamp: {
    now: jest.fn(() => ({ toMillis: () => Date.now() })),
    fromMillis: jest.fn((ms: number) => ({ toMillis: () => ms })),
  },
}));

import * as firestore from 'firebase/firestore';
const getDocs = firestore.getDocs as jest.Mock;

const since = { toMillis: () => 0 } as any;

function makeGroup(id: string, overrides: Partial<any> = {}): Group {
  return new Group({ id, name: 'Test Group', image: { uri: 'file:///test/g.png' }, members: [], admins: [], walls: [], problems: [], ...overrides });
}

function makeSnapshot(docs: { id: string; data: object; is_deleted?: boolean }[]) {
  return {
    forEach: (cb: (d: any) => void) =>
      docs.forEach((d) => cb({ id: d.id, data: () => ({ ...d.data, is_deleted: d.is_deleted }) })),
  };
}

// ─── Wall: JSON field roundtrips ──────────────────────────────────────────────

describe('Wall — configuredHolds JSON roundtrip', () => {
  it('complex holds array survives insert/load cycle', async () => {
    const { dal } = await createTestDAL();
    const holds = [
      { svgPath: 'M 10 20 L 30 40', color: '#FF0000', length: 25, label: 'V1', x: 15, y: 35 },
      { svgPath: 'M 50 60 L 70 80', color: '#00FF00', length: 10, label: 'V2', x: 55, y: 65 },
    ];
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'w-holds', configuredHolds: holds })));
    const wall = dal.walls.Get({ id: 'w-holds' });
    expect(wall.configuredHolds).toEqual(holds);
  });

  it('remoteImage JSON roundtrip', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(
      new Wall(makeWallData({ id: 'w-ri', remoteImage: { commpressed: 'http://c.jpg', full: 'http://f.jpg' } })),
    );
    const wall = dal.walls.Get({ id: 'w-ri' });
    expect(wall.remoteImage).toEqual({ commpressed: 'http://c.jpg', full: 'http://f.jpg' });
  });
});

describe('Wall — List edge cases', () => {
  it('List({ids: []}) returns empty array without crash', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'w-x' })));
    expect(dal.walls.List({ ids: [] })).toEqual([]);
  });

  it('List({ids: ["nonexistent"]}) returns empty array', async () => {
    const { dal } = await createTestDAL();
    expect(dal.walls.List({ ids: ['nonexistent'] })).toEqual([]);
  });

  it('List returns all walls when ids contains mix of existing and nonexistent', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'exists' })));
    const result = dal.walls.List({ ids: ['exists', 'ghost'] });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('exists');
  });

  it('List({isPublic: false}) returns ALL walls — GetListQuery skips falsy isPublic filter', async () => {
    // WallDAL.GetListQuery: `if (params.isPublic)` only adds filter for truthy values.
    // isPublic=false is falsy → filter not applied → all walls returned.
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'pub', isPublic: true })));
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'priv', isPublic: false })));
    const result = dal.walls.List({ isPublic: false });
    // Both returned because false filter is ignored
    expect(result.some((w) => w.id === 'priv')).toBe(true);
    expect(result.some((w) => w.id === 'pub')).toBe(true);
  });
});

describe('Wall — shouldPushToRemote', () => {
  it('public wall → true', () => {
    const wall = new Wall(makeWallData({ isPublic: true }));
    expect(wall.shouldPushToRemote()).toBe(true);
  });

  it('private non-anonymous wall → false', () => {
    const wall = new Wall(makeWallData({ isPublic: false, owner: 'user-1', name: 'Normal', gym: 'Gym' }));
    expect(wall.shouldPushToRemote()).toBe(false);
  });

  it('anonymous wall (owner===gym, name==="Anonimus") → true even when private', () => {
    const wall = new Wall(makeWallData({ isPublic: false, owner: 'SomeGym', gym: 'SomeGym', name: 'Anonimus' }));
    expect(wall.shouldPushToRemote()).toBe(true);
  });
});

describe('Wall — FetchFromRemote edge: angle -1 stored as undefined', () => {
  it('remote angle -1 → wall.angle === undefined', async () => {
    const { dal } = await createTestDAL();
    getDocs.mockResolvedValueOnce(
      makeSnapshot([{
        id: 'angle-wall',
        data: {
          id: 'angle-wall', name: 'W', gym: 'G', owner: 'other', isPublic: true,
          angle: -1, configuredHolds: [], version: 1, activeWallId: null,
          image: { commpressed: 'file:///test/w.png', full: 'file:///test/w_full.png' },
        },
      }]),
    );
    await dal.walls.FetchFromRemote(since);
    const wall = dal.walls.List({ id: 'angle-wall' })[0];
    // fromRemoteDoc converts angle -1 → undefined, but SQLite stores NULL → retrieved as null
    expect(wall.angle).toBeNull();
  });
});

// ─── Problem: wallVersion filtering ──────────────────────────────────────────

describe('Problem — wallVersion filtering', () => {
  it('List({wallId}) returns only problems matching wall current version', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-v1', version: 1 })));
    await dal.problems.AddToLocal(
      new Problem(makeProblemData({ id: 'prob-v1', wallId: 'wall-v1', wallVersion: 1 })),
    );
    await dal.problems.AddToLocal(
      new Problem(makeProblemData({ id: 'prob-v2', wallId: 'wall-v1', wallVersion: 2, name: 'V2 Problem' })),
    );

    // No wallVersion specified → uses wall.version (1)
    const results = dal.problems.List({ wallId: 'wall-v1' });
    expect(results.some((p: any) => p.id === 'prob-v1')).toBe(true);
    expect(results.some((p: any) => p.id === 'prob-v2')).toBe(false);
  });

  it('List({wallId, wallVersion: 2}) returns only v2 problems', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-v1', version: 1 })));
    await dal.problems.AddToLocal(
      new Problem(makeProblemData({ id: 'prob-v1', wallId: 'wall-v1', wallVersion: 1 })),
    );
    await dal.problems.AddToLocal(
      new Problem(makeProblemData({ id: 'prob-v2', wallId: 'wall-v1', wallVersion: 2, name: 'V2' })),
    );

    const results = dal.problems.List({ wallId: 'wall-v1', wallVersion: 2 });
    expect(results.some((p: any) => p.id === 'prob-v2')).toBe(true);
    expect(results.some((p: any) => p.id === 'prob-v1')).toBe(false);
  });
});

describe('Problem — groupId forces isPublic=false', () => {
  it('List({groupId}) returns private problems in the group', async () => {
    const { dal, db } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-001' })));
    await dal.problems.AddToLocal(
      new Problem(makeProblemData({ id: 'priv-prob', isPublic: false })),
    );
    await GroupTable.insert({ id: 'grp-p', name: 'G', image: { uri: 'file:///test/g.png' } }, db as any);
    await GroupProblemTable.insert({ problem_id: 'priv-prob', group_id: 'grp-p' }, db as any);

    const results = dal.problems.List({ groupId: 'grp-p' });
    expect(results.some((p: any) => p.id === 'priv-prob')).toBe(true);
  });

  it('List({groupId}) does not return public problems not in the group', async () => {
    const { dal, db } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-001' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'pub-outside', isPublic: true })));
    await GroupTable.insert({ id: 'grp-p2', name: 'G', image: { uri: 'file:///test/g.png' } }, db as any);

    const results = dal.problems.List({ groupId: 'grp-p2' });
    expect(results.some((p: any) => p.id === 'pub-outside')).toBe(false);
  });
});

describe('Problem — shouldPushToRemote delegates to wall', () => {
  it('public wall → problem can push', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-001', isPublic: true })));
    const prob = new Problem(makeProblemData({ id: 'prob-push' }));
    prob.setDAL(dal);
    expect(prob.shouldPushToRemote()).toBe(true);
  });

  it('private wall → problem cannot push', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-priv', isPublic: false, owner: 'u', name: 'Normal', gym: 'Gym' })));
    const prob = new Problem(makeProblemData({ id: 'prob-nopush', wallId: 'wall-priv' }));
    prob.setDAL(dal);
    expect(prob.shouldPushToRemote()).toBe(false);
  });

  it('problem on anonymous group wall → can push', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(
      new Wall(makeWallData({ id: 'anon-wall', isPublic: false, owner: 'AnyGym', gym: 'AnyGym', name: 'Anonimus' })),
    );
    const prob = new Problem(makeProblemData({ id: 'prob-anon', wallId: 'anon-wall' }));
    prob.setDAL(dal);
    expect(prob.shouldPushToRemote()).toBe(true);
  });
});

describe('Problem — type filter', () => {
  it('List({type}) returns only matching type', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-001' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'boulder', type: 'boulder' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'route', name: 'Route', type: 'route' })));
    const results = dal.problems.List({ type: 'route' });
    expect(results.some((p: any) => p.id === 'route')).toBe(true);
    expect(results.some((p: any) => p.id === 'boulder')).toBe(false);
  });
});

// ─── User: role-specific wall removal ────────────────────────────────────────

describe('UserDAL — RemoveWall role guard', () => {
  it('RemoveWall does NOT remove owner-role row', async () => {
    const { dal, db } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-own' })));
    await UserWallTable.insert({ wall_id: 'wall-own', user_id: 'test-user-001', role: 'owner' }, db as any);

    await dal.users.RemoveWall({ wall_id: 'wall-own', user_id: 'test-user-001' });

    const stmt = db._raw.prepare('SELECT role FROM user_wall WHERE wall_id = ? AND user_id = ?');
    stmt.bind(['wall-own', 'test-user-001']);
    expect(stmt.step()).toBe(true); // row still exists
    expect((stmt.getAsObject() as any).role).toBe('owner');
    stmt.free();
  });

  it('RemoveWall DOES remove viewer-role row', async () => {
    const { dal, db } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-view' })));
    await UserWallTable.insert({ wall_id: 'wall-view', user_id: 'test-user-001', role: 'viewer' }, db as any);

    await dal.users.RemoveWall({ wall_id: 'wall-view', user_id: 'test-user-001' });

    const stmt = db._raw.prepare('SELECT wall_id FROM user_wall WHERE wall_id = ? AND user_id = ?');
    stmt.bind(['wall-view', 'test-user-001']);
    expect(stmt.step()).toBe(false);
    stmt.free();
  });

  it('RemoveGroup removes user from group_member', async () => {
    const { dal, db } = await createTestDAL();
    await GroupTable.insert({ id: 'grp-rg', name: 'G', image: { uri: 'file:///test/g.png' } }, db as any);
    await GroupMemberTable.insert({ user_id: 'test-user-001', group_id: 'grp-rg', role: 'member' }, db as any);

    await dal.users.RemoveGroup({ group_id: 'grp-rg', user_id: 'test-user-001' });

    const stmt = db._raw.prepare('SELECT user_id FROM group_member WHERE group_id = ? AND user_id = ?');
    stmt.bind(['grp-rg', 'test-user-001']);
    expect(stmt.step()).toBe(false);
    stmt.free();
  });
});

describe('User entity — property getters', () => {
  it('User.lastPulled getter/setter roundtrip', async () => {
    const { dal } = await createTestDAL();
    const user = dal.users.List({ id: 'test-user-001' })[0];
    user.lastPulled = 999999;
    // setter is async but fire-and-forget — give it a tick
    await new Promise((r) => setTimeout(r, 20));
    expect(dal.users.getLastPulled(user)).toBe(999999);
  });

  it('User.getProblemTags returns tags for the problem', async () => {
    const { dal } = await createTestDAL();
    const user = dal.users.List({ id: 'test-user-001' })[0];
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-001' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'prob-tags' })));
    await dal.ticks.AddToLocal(new UserTick({ userId: 'test-user-001', problemId: 'prob-tags', tag: 'sent' }));
    expect(user.getProblemTags('prob-tags')).toContain('sent');
  });
});

// ─── Group: entity-level mutations ───────────────────────────────────────────

describe('Group entity — AddProblem / RemoveProblem', () => {
  it('AddProblem inserts into group_problem and persists', async () => {
    const { dal, db } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-001' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'new-ep', isPublic: false })));
    await dal.groups.AddToLocal(makeGroup('grp-ep'));

    const group = dal.groups.Get({ id: 'grp-ep' });
    await group.AddProblem({ problem_id: 'new-ep' });

    const stmt = db._raw.prepare('SELECT problem_id FROM group_problem WHERE group_id = ? AND problem_id = ?');
    stmt.bind(['grp-ep', 'new-ep']);
    expect(stmt.step()).toBe(true);
    stmt.free();
  });

  it('RemoveProblem removes from group_problem', async () => {
    const { dal, db } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-001' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'rm-ep', isPublic: false })));
    await dal.groups.AddToLocal(makeGroup('grp-rmep', { problems: ['rm-ep'] }));

    const group = dal.groups.Get({ id: 'grp-rmep' });
    await group.RemoveProblem({ problem_id: 'rm-ep' });

    const stmt = db._raw.prepare('SELECT problem_id FROM group_problem WHERE group_id = ? AND problem_id = ?');
    stmt.bind(['grp-rmep', 'rm-ep']);
    expect(stmt.step()).toBe(false);
    stmt.free();
  });
});

describe('Group entity — AddWall / AddMember', () => {
  it('AddWall inserts into group_wall', async () => {
    const { dal, db } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'new-gw' })));
    await dal.groups.AddToLocal(makeGroup('grp-aw'));

    const group = dal.groups.Get({ id: 'grp-aw' });
    await group.AddWall({ wall_id: 'new-gw' });

    const stmt = db._raw.prepare('SELECT wall_id FROM group_wall WHERE group_id = ? AND wall_id = ?');
    stmt.bind(['grp-aw', 'new-gw']);
    expect(stmt.step()).toBe(true);
    stmt.free();
  });

  it('AddMember inserts member row with default role', async () => {
    const { dal, db } = await createTestDAL();
    await UserTable.insert({ id: 'new-mem', name: 'New' }, db as any);
    await dal.groups.AddToLocal(makeGroup('grp-am', { members: ['test-user-001'], admins: ['test-user-001'] }));

    const group = dal.groups.Get({ id: 'grp-am' });
    await group.AddMember({ user_id: 'new-mem' });

    const stmt = db._raw.prepare('SELECT role FROM group_member WHERE group_id = ? AND user_id = ?');
    stmt.bind(['grp-am', 'new-mem']);
    stmt.step();
    expect((stmt.getAsObject() as any).role).toBe('member');
    stmt.free();
  });

  it('AddMember with role=admin inserts admin row', async () => {
    const { dal, db } = await createTestDAL();
    await UserTable.insert({ id: 'new-admin', name: 'Admin' }, db as any);
    await dal.groups.AddToLocal(makeGroup('grp-aa', { members: ['test-user-001'], admins: ['test-user-001'] }));

    const group = dal.groups.Get({ id: 'grp-aa' });
    await group.AddMember({ user_id: 'new-admin', role: 'admin' });

    const stmt = db._raw.prepare('SELECT role FROM group_member WHERE group_id = ? AND user_id = ?');
    stmt.bind(['grp-aa', 'new-admin']);
    stmt.step();
    expect((stmt.getAsObject() as any).role).toBe('admin');
    stmt.free();
  });
});

describe('Group — FilterProblems', () => {
  it('returns problems in group matching filter', async () => {
    const { dal, db } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-001' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'gfp-easy', grade: 3, isPublic: false })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'gfp-hard', grade: 15, name: 'Hard', isPublic: false })));
    await dal.groups.AddToLocal(makeGroup('grp-fp', { problems: ['gfp-easy', 'gfp-hard'] }));
    await GroupProblemTable.insert({ problem_id: 'gfp-easy', group_id: 'grp-fp' }, db as any);
    await GroupProblemTable.insert({ problem_id: 'gfp-hard', group_id: 'grp-fp' }, db as any);

    const group = dal.groups.Get({ id: 'grp-fp' });
    const results = group.FilterProblems({ maxGrade: 5 });
    expect(results.some((p: any) => p.id === 'gfp-easy')).toBe(true);
    expect(results.some((p: any) => p.id === 'gfp-hard')).toBe(false);
  });
});

describe('Group — PrivateWalls and PublicWalls', () => {
  it('PrivateWalls returns only non-public walls linked to group', async () => {
    const { dal, db } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'pub-wall', isPublic: true })));
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'priv-wall', isPublic: false })));
    await dal.groups.AddToLocal(makeGroup('grp-pw', { walls: ['pub-wall', 'priv-wall'] }));
    await GroupWallTable.insert({ wall_id: 'pub-wall', group_id: 'grp-pw' }, db as any);
    await GroupWallTable.insert({ wall_id: 'priv-wall', group_id: 'grp-pw' }, db as any);

    const group = dal.groups.Get({ id: 'grp-pw' });
    const privateWalls = group.PrivateWalls;
    expect(privateWalls.some((w) => w.id === 'priv-wall')).toBe(true);
    expect(privateWalls.some((w) => w.id === 'pub-wall')).toBe(false);
  });

  it('PublicWalls excludes private walls', async () => {
    const { dal, db } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'pub-wall2', isPublic: true })));
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'priv-wall2', isPublic: false })));
    await dal.groups.AddToLocal(makeGroup('grp-pubw', { walls: ['pub-wall2', 'priv-wall2'] }));
    await GroupWallTable.insert({ wall_id: 'pub-wall2', group_id: 'grp-pubw' }, db as any);
    await GroupWallTable.insert({ wall_id: 'priv-wall2', group_id: 'grp-pubw' }, db as any);

    const group = dal.groups.Get({ id: 'grp-pubw' });
    const publicWalls = group.PublicWalls;
    expect(publicWalls.some((w) => w.id === 'pub-wall2')).toBe(true);
    expect(publicWalls.some((w) => w.id === 'priv-wall2')).toBe(false);
  });
});

describe('Group — getDescription', () => {
  it('2 members → "Name1, Name2"', async () => {
    const { dal, db } = await createTestDAL();
    await UserTable.insert({ id: 'desc-u2', name: 'Alice' }, db as any);
    await dal.groups.AddToLocal(makeGroup('grp-desc2', { members: ['test-user-001', 'desc-u2'] }));
    const group = dal.groups.Get({ id: 'grp-desc2' });
    const desc = group.getDescription();
    expect(desc).toContain('Test User');
    expect(desc).toContain('Alice');
    expect(desc).not.toContain('...');
  });

  it('4 members → truncated with "..."', async () => {
    const { dal, db } = await createTestDAL();
    await UserTable.insert({ id: 'du2', name: 'B' }, db as any);
    await UserTable.insert({ id: 'du3', name: 'C' }, db as any);
    await UserTable.insert({ id: 'du4', name: 'D' }, db as any);
    const members = ['test-user-001', 'du2', 'du3', 'du4'];
    await dal.groups.AddToLocal(makeGroup('grp-desc4', { members }));
    const group = dal.groups.Get({ id: 'grp-desc4' });
    const desc = group.getDescription();
    expect(desc).toContain('...');
  });
});

describe('Group.fromRemoteDoc — image handling', () => {
  it('without old group uses data.image.full as URI', () => {
    const data = {
      id: 'g1', name: 'G', members: [], admins: [], walls: [], problems: [],
      image: { full: 'http://full.jpg', commpressed: 'http://small.jpg' },
    };
    const group = Group.fromRemoteDoc(data);
    expect(group.image.uri).toBe('http://full.jpg');
  });

  it('with old group reuses old image (no re-download)', () => {
    const oldGroup = new Group({
      id: 'g1', name: 'Old', image: { uri: 'file:///test/cached.png' },
    });
    const data = {
      id: 'g1', name: 'Updated', members: [], admins: [], walls: [], problems: [],
      image: { full: 'http://new-full.jpg', commpressed: 'http://new-small.jpg' },
    };
    const group = Group.fromRemoteDoc(data, oldGroup);
    expect(group.image.uri).toBe('file:///test/cached.png');
    expect(group.name).toBe('Updated'); // name still updated
  });
});

describe('Group — UpdateLocal with no changes', () => {
  it('no-op UpdateLocal (same members/walls/problems) does not crash', async () => {
    const { dal, db } = await createTestDAL();
    await UserTable.insert({ id: 'noop-user', name: 'NoOp' }, db as any);
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'noop-wall' })));
    await dal.groups.AddToLocal(
      makeGroup('grp-noop', { members: ['test-user-001', 'noop-user'], walls: ['noop-wall'] }),
    );

    const group = dal.groups.Get({ id: 'grp-noop' });
    // Call UpdateLocal without changing anything
    await expect(dal.groups.UpdateLocal(group)).resolves.toBeDefined();

    // Members unchanged
    const stmt = db._raw.prepare('SELECT COUNT(*) as cnt FROM group_member WHERE group_id = ?');
    stmt.bind(['grp-noop']);
    stmt.step();
    expect((stmt.getAsObject() as any).cnt).toBe(2);
    stmt.free();
  });
});

// ─── UserTick edge cases ──────────────────────────────────────────────────────

describe('UserTickDAL — getUserCustomTags deduplication', () => {
  it('same tag on multiple problems appears only once', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-001' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'p1' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'p2', name: 'P2' })));

    await dal.ticks.AddToLocal(new UserTick({ userId: 'test-user-001', problemId: 'p1', tag: 'crimpy' }));
    await dal.ticks.AddToLocal(new UserTick({ userId: 'test-user-001', problemId: 'p2', tag: 'crimpy' }));

    const tags = dal.ticks.getUserCustomTags();
    const crimpy = tags.filter((t) => t === 'crimpy');
    expect(crimpy).toHaveLength(1);
  });
});

describe('UserTickDAL — getTicksForProblem', () => {
  it('returns empty array when no ticks exist', async () => {
    const { dal } = await createTestDAL();
    expect(dal.ticks.getTicksForProblem('nonexistent-prob')).toEqual([]);
  });

  it('only returns ticks for the specific problem', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-001' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'p-target' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'p-other', name: 'Other' })));

    await dal.ticks.AddToLocal(new UserTick({ userId: 'test-user-001', problemId: 'p-target', tag: 'sent' }));
    await dal.ticks.AddToLocal(new UserTick({ userId: 'test-user-001', problemId: 'p-other', tag: 'project' }));

    const ticks = dal.ticks.getTicksForProblem('p-target');
    expect(ticks).toHaveLength(1);
    expect(ticks[0].problemId).toBe('p-target');
  });

  it('multiple different tags on same problem all returned', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-001' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'multi-p' })));

    await dal.ticks.AddToLocal(new UserTick({ userId: 'test-user-001', problemId: 'multi-p', tag: 'sent' }));
    await dal.ticks.AddToLocal(new UserTick({ userId: 'test-user-001', problemId: 'multi-p', tag: 'project' }));
    await dal.ticks.AddToLocal(new UserTick({ userId: 'test-user-001', problemId: 'multi-p', tag: 'attempt' }));

    const ticks = dal.ticks.getTicksForProblem('multi-p');
    expect(ticks).toHaveLength(3);
  });
});

// ─── BaseDAL edge cases ───────────────────────────────────────────────────────

describe('BaseDAL — duplicate key handling', () => {
  it('AddToLocal with duplicate ID throws (PK constraint)', async () => {
    const { dal } = await createTestDAL();
    const wall = new Wall(makeWallData({ id: 'dup-wall' }));
    await dal.walls.AddToLocal(wall);
    await expect(dal.walls.AddToLocal(wall)).rejects.toMatch(/failed adding object/);
  });
});

describe('BaseDAL — FetchFromRemote empty snapshot', () => {
  it('empty snapshot causes no changes and no crash', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'stable-wall' })));

    getDocs.mockResolvedValueOnce(makeSnapshot([]));
    await expect(dal.walls.FetchFromRemote(since)).resolves.not.toThrow();

    // Existing wall unchanged
    expect(dal.walls.List({ id: 'stable-wall' })).toHaveLength(1);
  });
});

describe('BaseDAL — FetchFromRemote per-doc error isolation', () => {
  it('bad doc logged and skipped, good doc still processed', async () => {
    const { dal } = await createTestDAL();

    getDocs.mockResolvedValueOnce(
      makeSnapshot([
        { id: 'bad-doc', data: null as any },   // will throw in fromRemoteDoc
        {
          id: 'good-doc',
          data: {
            id: 'good-doc', name: 'Good Wall', gym: 'G', owner: 'other', isPublic: true,
            angle: -1, configuredHolds: [], version: 1, activeWallId: null,
            image: { commpressed: 'file:///test/g.png', full: 'file:///test/g_full.png' },
          },
        },
      ]),
    );

    await dal.walls.FetchFromRemote(since);

    // Good doc added
    expect(dal.walls.List({ id: 'good-doc' })).toHaveLength(1);
    // Bad doc not added
    expect(dal.walls.List({ id: 'bad-doc' })).toHaveLength(0);
  });
});

describe('BaseDAL — List returns empty for no matches', () => {
  it('List with unknown id returns empty array', async () => {
    const { dal } = await createTestDAL();
    expect(dal.walls.List({ id: 'absolutely-not-there' })).toEqual([]);
  });

  it('List on empty table returns empty array', async () => {
    const { dal } = await createTestDAL();
    expect(dal.problems.List({})).toEqual([]);
  });
});

// ─── BaseTable — query edge cases ────────────────────────────────────────────

describe('BaseTable — filter edge cases', () => {
  it('filter with value=0 (falsy but valid) works correctly', async () => {
    const { dal, db } = await createTestDAL();
    // angle=0 is falsy but should be stored and retrieved
    await WallTable.insert({
      id: 'zero-angle', name: 'Z', gym: 'G', image: { uri: 'file:///test/z.png' },
      owner: 'other', isPublic: true, version: 1, angle: 0,
    }, db as any);

    const [sql, args] = WallTable.filter([WallTable.getField('angle')!.eq(0)]);
    const rows = db.getAllSync<any>(sql, args);
    expect(rows).toHaveLength(1);
    expect(rows[0].angle).toBe(0);
  });

  it('like filter is case-insensitive for ASCII', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'case-wall', name: 'CRIMPY WALL' })));
    const results = dal.walls.List({ name: 'crimpy' });
    // SQLite LIKE is case-insensitive for ASCII
    expect(results.some((w) => w.id === 'case-wall')).toBe(true);
  });

  it('multiple filters combined with AND', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'match', name: 'Cave', isPublic: true })));
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'nomatch-name', name: 'Slab', isPublic: true })));
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'nomatch-pub', name: 'Cave2', isPublic: false })));

    const results = dal.walls.List({ name: 'Cave', isPublic: true });
    expect(results.some((w) => w.id === 'match')).toBe(true);
    expect(results.some((w) => w.id === 'nomatch-name')).toBe(false);
    expect(results.some((w) => w.id === 'nomatch-pub')).toBe(false);
  });
});

// ─── User entity — wall shortcuts ─────────────────────────────────────────────

describe('User entity — ownedWalls / viewerWalls', () => {
  it('ownedWalls returns only owner-role walls', async () => {
    const { dal, db } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'my-wall' })));
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'view-wall', name: 'Viewed' })));
    await UserWallTable.insert({ wall_id: 'my-wall', user_id: 'test-user-001', role: 'owner' }, db as any);
    await UserWallTable.insert({ wall_id: 'view-wall', user_id: 'test-user-001', role: 'viewer' }, db as any);

    const user = dal.users.List({ id: 'test-user-001' })[0];
    const owned = user.ownedWalls;
    expect(owned.some((w) => w.id === 'my-wall')).toBe(true);
    expect(owned.some((w) => w.id === 'view-wall')).toBe(false);
  });

  it('viewerWalls returns only viewer-role walls', async () => {
    const { dal, db } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'viewer-wall' })));
    await UserWallTable.insert({ wall_id: 'viewer-wall', user_id: 'test-user-001', role: 'viewer' }, db as any);

    const user = dal.users.List({ id: 'test-user-001' })[0];
    expect(user.viewerWalls.some((w) => w.id === 'viewer-wall')).toBe(true);
    expect(user.ownedWalls.some((w) => w.id === 'viewer-wall')).toBe(false);
  });
});

// ─── User entity — group membership ──────────────────────────────────────────

describe('User entity — groups getter', () => {
  it('user.groups returns groups the user is member of', async () => {
    const { dal, db } = await createTestDAL();
    await GroupTable.insert({ id: 'user-grp', name: 'UG', image: { uri: 'file:///test/g.png' } }, db as any);
    await GroupMemberTable.insert({ user_id: 'test-user-001', group_id: 'user-grp', role: 'member' }, db as any);

    const user = dal.users.List({ id: 'test-user-001' })[0];
    const groups = user.groups;
    expect(groups.some((g) => g.id === 'user-grp')).toBe(true);
  });
});
