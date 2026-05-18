// Groups have custom FetchFromRemote (syncGroupDoc, not BaseDAL.FetchFromRemote).
// Group.fromRemoteDoc requires data.image.full.
// Junction tables (group_member, group_wall, group_problem) have FK constraints.

import { createTestDAL, makeWallData, makeProblemData } from '../helpers/testDal';
import { Group } from '../../entities/group';
import { Wall } from '../../entities/wall';
import { Problem } from '../../entities/problem';
import { GroupTable, GroupMemberTable, GroupProblemTable, GroupWallTable, UserTable, UserConfigTable } from '../../tables/tables';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({ docs: [] }),
  getDoc: jest.fn().mockResolvedValue({ data: () => undefined, exists: () => false }),
  doc: jest.fn(),
  setDoc: jest.fn().mockResolvedValue(undefined),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  arrayUnion: jest.fn((...args: any[]) => ({ _union: args })),
  arrayRemove: jest.fn((...args: any[]) => ({ _remove: args })),
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

function makeGroup(id: string, overrides: Partial<any> = {}): Group {
  return new Group({
    id,
    name: 'Test Group',
    image: { uri: 'file:///test/group.png' },
    members: [],
    admins: [],
    walls: [],
    problems: [],
    ...overrides,
  });
}

// Remote doc shape for GroupDAL.FetchFromRemote (uses docs.docs array)
function makeGroupSnapshot(groups: { id: string; data: object; is_deleted?: boolean }[]) {
  return {
    docs: groups.map((g) => ({
      id: g.id,
      data: () => ({ ...g.data, is_deleted: g.is_deleted }),
    })),
  };
}

function remoteGroupDoc(id: string, overrides: Partial<any> = {}) {
  return {
    id,
    name: 'Remote Group',
    members: ['test-user-001'], // must include currentUser.id for the members array-contains query
    admins: ['test-user-001'],
    walls: [],
    problems: [],
    image: { full: 'file:///test/group.png', commpressed: 'file:///test/group_s.png' },
    ...overrides,
  };
}

// ─── Local: AddToLocal ────────────────────────────────────────────────────────

describe('GroupDAL local — AddToLocal', () => {
  it('inserts group row with no members/walls/problems', async () => {
    const { dal, db } = await createTestDAL();
    await dal.groups.AddToLocal(makeGroup('grp-empty'));
    const row = db._raw.prepare('SELECT id, name FROM group_table WHERE id = ?').getAsObject(['grp-empty']) as any;
    expect(row.id).toBe('grp-empty');
    expect(row.name).toBe('Test Group');
  });

  it('inserts group_member rows for all members', async () => {
    const { dal, db } = await createTestDAL();
    await UserTable.insert({ id: 'user-m2', name: 'Member 2' }, db as any);
    const group = makeGroup('grp-members', { members: ['test-user-001', 'user-m2'], admins: ['test-user-001'] });
    await dal.groups.AddToLocal(group);

    const stmt = db._raw.prepare('SELECT user_id, role FROM group_member WHERE group_id = ? ORDER BY user_id');
    stmt.bind(['grp-members']);
    const rows: any[] = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();

    expect(rows).toHaveLength(2);
    const adminRow = rows.find((r) => r.user_id === 'test-user-001');
    const memberRow = rows.find((r) => r.user_id === 'user-m2');
    expect(adminRow.role).toBe('admin');
    expect(memberRow.role).toBe('member');
  });

  it('inserts group_wall rows for all walls (wall must exist in DB)', async () => {
    const { dal, db } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'gw-wall' })));
    const group = makeGroup('grp-walls', { walls: ['gw-wall'] });
    await dal.groups.AddToLocal(group);

    const stmt = db._raw.prepare('SELECT wall_id FROM group_wall WHERE group_id = ?');
    stmt.bind(['grp-walls']);
    const rows: any[] = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    expect(rows.map((r) => r.wall_id)).toContain('gw-wall');
  });

  it('inserts group_problem rows for all problems (problem + wall must exist)', async () => {
    const { dal, db } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-001' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'gp-prob' })));
    const group = makeGroup('grp-problems', { problems: ['gp-prob'] });
    await dal.groups.AddToLocal(group);

    const stmt = db._raw.prepare('SELECT problem_id FROM group_problem WHERE group_id = ?');
    stmt.bind(['grp-problems']);
    const rows: any[] = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    expect(rows.map((r) => r.problem_id)).toContain('gp-prob');
  });
});

// ─── Local: Get ───────────────────────────────────────────────────────────────

describe('GroupDAL local — Get', () => {
  it('returns populated Group with members, walls, problems', async () => {
    const { dal, db } = await createTestDAL();
    await UserTable.insert({ id: 'user-g2', name: 'G2' }, db as any);
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-g' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'prob-g', wallId: 'wall-g' })));
    const group = makeGroup('grp-get', {
      members: ['test-user-001', 'user-g2'],
      admins: ['test-user-001'],
      walls: ['wall-g'],
      problems: ['prob-g'],
    });
    await dal.groups.AddToLocal(group);

    const loaded = dal.groups.Get({ id: 'grp-get' });
    expect(loaded.name).toBe('Test Group');
    expect(loaded.members).toContain('test-user-001');
    expect(loaded.members).toContain('user-g2');
    expect(loaded.admins).toContain('test-user-001');
    expect(loaded.walls).toContain('wall-g');
    expect(loaded.problems).toContain('prob-g');
  });
});

// ─── Local: List ─────────────────────────────────────────────────────────────

describe('GroupDAL local — List', () => {
  it('List() returns all groups', async () => {
    const { dal } = await createTestDAL();
    await dal.groups.AddToLocal(makeGroup('grp-a'));
    await dal.groups.AddToLocal(makeGroup('grp-b', { name: 'Group B' }));
    const results = dal.groups.List({});
    const ids = results.map((g: any) => g.id);
    expect(ids).toContain('grp-a');
    expect(ids).toContain('grp-b');
  });

  it('List({userId}) returns only groups the user is a member of', async () => {
    const { dal, db } = await createTestDAL();
    await UserTable.insert({ id: 'user-not-member', name: 'Other' }, db as any);
    await dal.groups.AddToLocal(makeGroup('grp-mine', { members: ['test-user-001'] }));
    await dal.groups.AddToLocal(makeGroup('grp-other', { members: ['user-not-member'] }));
    const results = dal.groups.List({ userId: 'test-user-001' });
    const ids = results.map((g: any) => g.id);
    expect(ids).toContain('grp-mine');
    expect(ids).not.toContain('grp-other');
  });
});

// ─── Local: UpdateLocal member sync ──────────────────────────────────────────

describe('GroupDAL local — UpdateLocal member sync', () => {
  async function setupGroupWithMembers(dal: any, db: any, groupId: string, members: string[], admins: string[]) {
    await dal.groups.AddToLocal(makeGroup(groupId, { members, admins }));
  }

  it('adds new member to group_member table', async () => {
    const { dal, db } = await createTestDAL();
    await UserTable.insert({ id: 'new-member', name: 'New Member' }, db as any);
    await setupGroupWithMembers(dal, db, 'grp-addm', ['test-user-001'], ['test-user-001']);

    const group = dal.groups.Get({ id: 'grp-addm' });
    group.members.push('new-member');
    await dal.groups.UpdateLocal(group);

    const stmt = db._raw.prepare('SELECT user_id FROM group_member WHERE group_id = ? AND user_id = ?');
    stmt.bind(['grp-addm', 'new-member']);
    expect(stmt.step()).toBe(true);
    stmt.free();
  });

  it('removes departed member from group_member table', async () => {
    const { dal, db } = await createTestDAL();
    await UserTable.insert({ id: 'leaving', name: 'Leaving' }, db as any);
    await setupGroupWithMembers(dal, db, 'grp-rmmember', ['test-user-001', 'leaving'], ['test-user-001']);

    const group = dal.groups.Get({ id: 'grp-rmmember' });
    group.members = group.members.filter((m: string) => m !== 'leaving');
    await dal.groups.UpdateLocal(group);

    const stmt = db._raw.prepare('SELECT user_id FROM group_member WHERE group_id = ? AND user_id = ?');
    stmt.bind(['grp-rmmember', 'leaving']);
    expect(stmt.step()).toBe(false);
    stmt.free();
  });

  it('promotes member to admin — role updated in group_member', async () => {
    const { dal, db } = await createTestDAL();
    await UserTable.insert({ id: 'promotee', name: 'Promotee' }, db as any);
    await setupGroupWithMembers(dal, db, 'grp-promote', ['test-user-001', 'promotee'], ['test-user-001']);

    const group = dal.groups.Get({ id: 'grp-promote' });
    group.admins.push('promotee'); // promote to admin
    await dal.groups.UpdateLocal(group);

    const stmt = db._raw.prepare('SELECT role FROM group_member WHERE group_id = ? AND user_id = ?');
    stmt.bind(['grp-promote', 'promotee']);
    stmt.step();
    expect((stmt.getAsObject() as any).role).toBe('admin');
    stmt.free();
  });
});

// ─── Local: UpdateLocal wall + problem sync ───────────────────────────────────

describe('GroupDAL local — UpdateLocal wall/problem sync', () => {
  it('adds new wall to group_wall', async () => {
    const { dal, db } = await createTestDAL();
    await dal.groups.AddToLocal(makeGroup('grp-wall-add', { walls: [] }));
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'new-gwall' })));

    const group = dal.groups.Get({ id: 'grp-wall-add' });
    group.walls.push('new-gwall');
    await dal.groups.UpdateLocal(group);

    const stmt = db._raw.prepare('SELECT wall_id FROM group_wall WHERE group_id = ? AND wall_id = ?');
    stmt.bind(['grp-wall-add', 'new-gwall']);
    expect(stmt.step()).toBe(true);
    stmt.free();
  });

  it('removes wall from group_wall', async () => {
    const { dal, db } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'rm-gwall', isPublic: false })));
    await dal.groups.AddToLocal(makeGroup('grp-wall-rm', { walls: ['rm-gwall'] }));

    const group = dal.groups.Get({ id: 'grp-wall-rm' });
    group.walls = [];
    await dal.groups.UpdateLocal(group);

    const stmt = db._raw.prepare('SELECT wall_id FROM group_wall WHERE group_id = ? AND wall_id = ?');
    stmt.bind(['grp-wall-rm', 'rm-gwall']);
    expect(stmt.step()).toBe(false);
    stmt.free();
  });

  it('adds problem to group_problem', async () => {
    const { dal, db } = await createTestDAL();
    await dal.groups.AddToLocal(makeGroup('grp-prob-add'));
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-001' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'new-gprob' })));

    const group = dal.groups.Get({ id: 'grp-prob-add' });
    group.problems.push('new-gprob');
    await dal.groups.UpdateLocal(group);

    const stmt = db._raw.prepare('SELECT problem_id FROM group_problem WHERE group_id = ? AND problem_id = ?');
    stmt.bind(['grp-prob-add', 'new-gprob']);
    expect(stmt.step()).toBe(true);
    stmt.free();
  });

  it('removes problem from group_problem', async () => {
    const { dal, db } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-001' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'rm-gprob' })));
    await dal.groups.AddToLocal(makeGroup('grp-prob-rm', { problems: ['rm-gprob'] }));

    const group = dal.groups.Get({ id: 'grp-prob-rm' });
    group.problems = [];
    await dal.groups.UpdateLocal(group);

    const stmt = db._raw.prepare('SELECT problem_id FROM group_problem WHERE group_id = ? AND problem_id = ?');
    stmt.bind(['grp-prob-rm', 'rm-gprob']);
    expect(stmt.step()).toBe(false);
    stmt.free();
  });
});

// ─── Remote: FetchFromRemote ──────────────────────────────────────────────────

describe('GroupDAL remote — FetchFromRemote', () => {
  it('new group inserted with member rows', async () => {
    const { dal, db } = await createTestDAL();
    await UserTable.insert({ id: 'member-2', name: 'M2' }, db as any);

    getDocs.mockResolvedValueOnce(
      makeGroupSnapshot([
        {
          id: 'remote-grp-001',
          data: remoteGroupDoc('remote-grp-001', {
            members: ['test-user-001', 'member-2'],
            admins: ['test-user-001'],
          }),
        },
      ]),
    );

    await dal.groups.FetchFromRemote(since);

    const grpRow = db._raw.prepare('SELECT id FROM group_table WHERE id = ?').getAsObject(['remote-grp-001']) as any;
    expect(grpRow.id).toBe('remote-grp-001');

    const stmt = db._raw.prepare('SELECT user_id FROM group_member WHERE group_id = ?');
    stmt.bind(['remote-grp-001']);
    const memberIds: string[] = [];
    while (stmt.step()) memberIds.push((stmt.getAsObject() as any).user_id);
    stmt.free();
    expect(memberIds).toContain('test-user-001');
    expect(memberIds).toContain('member-2');
  });

  it('existing group — new member added', async () => {
    const { dal, db } = await createTestDAL();
    await UserTable.insert({ id: 'new-rm', name: 'New Remote Member' }, db as any);
    await dal.groups.AddToLocal(makeGroup('grp-update', { members: ['test-user-001'], admins: ['test-user-001'] }));

    getDocs.mockResolvedValueOnce(
      makeGroupSnapshot([
        {
          id: 'grp-update',
          data: remoteGroupDoc('grp-update', {
            members: ['test-user-001', 'new-rm'],
            admins: ['test-user-001'],
          }),
        },
      ]),
    );

    await dal.groups.FetchFromRemote(since);

    const stmt = db._raw.prepare('SELECT user_id FROM group_member WHERE group_id = ? AND user_id = ?');
    stmt.bind(['grp-update', 'new-rm']);
    expect(stmt.step()).toBe(true);
    stmt.free();
  });

  it('is_deleted removes group and cascade deletes junction rows', async () => {
    const { dal, db } = await createTestDAL();
    await dal.groups.AddToLocal(makeGroup('grp-del', { members: ['test-user-001'] }));

    getDocs.mockResolvedValueOnce(
      makeGroupSnapshot([{ id: 'grp-del', data: remoteGroupDoc('grp-del'), is_deleted: true }]),
    );

    await dal.groups.FetchFromRemote(since);

    const stmt = db._raw.prepare('SELECT id FROM group_table WHERE id = ?');
    stmt.bind(['grp-del']);
    expect(stmt.step()).toBe(false);
    stmt.free();
  });

  it('empty docs array — no changes', async () => {
    const { dal } = await createTestDAL();
    await dal.groups.AddToLocal(makeGroup('grp-untouched'));
    getDocs.mockResolvedValueOnce(makeGroupSnapshot([]));
    await dal.groups.FetchFromRemote(since);
    expect(dal.groups.List({ id: 'grp-untouched' })).toHaveLength(1);
  });
});
