import { createTestDAL, makeWallData, makeProblemData } from '../helpers/testDal';
import { UserTick } from '../../entities/userTick';
import { Wall } from '../../entities/wall';
import { Problem } from '../../entities/problem';
import { UserTable } from '../../tables/tables';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  and: jest.fn(),
  or: jest.fn(),
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

// Seed a wall + problem so FK constraints on user_ticks pass.
async function seedWallAndProblem(dal: any, wallId = 'wall-001', problemId = 'prob-001') {
  await dal.walls.AddToLocal(new Wall(makeWallData({ id: wallId })));
  await dal.problems.AddToLocal(new Problem(makeProblemData({ id: problemId, wallId })));
}

// ─── Local: toggleTick ───────────────────────────────────────────────────────

describe('UserTickDAL local — toggleTick', () => {
  it('adds tick when none exists', async () => {
    const { dal, db } = await createTestDAL();
    await seedWallAndProblem(dal);
    await dal.ticks.toggleTick('prob-001', 'sent');
    const stmt = db._raw.prepare(
      'SELECT tag FROM user_ticks WHERE user_id = ? AND problem_id = ?',
    );
    stmt.bind(['test-user-001', 'prob-001']);
    expect(stmt.step()).toBe(true);
    expect((stmt.getAsObject() as any).tag).toBe('sent');
    stmt.free();
  });

  it('removes tick when one already exists', async () => {
    const { dal, db } = await createTestDAL();
    await seedWallAndProblem(dal);
    await dal.ticks.toggleTick('prob-001', 'project');
    await dal.ticks.toggleTick('prob-001', 'project'); // second call removes
    const stmt = db._raw.prepare(
      'SELECT tag FROM user_ticks WHERE user_id = ? AND problem_id = ? AND tag = ?',
    );
    stmt.bind(['test-user-001', 'prob-001', 'project']);
    expect(stmt.step()).toBe(false);
    stmt.free();
  });

  it('different tags are independent — toggling project does not remove sent', async () => {
    const { dal } = await createTestDAL();
    await seedWallAndProblem(dal);
    await dal.ticks.toggleTick('prob-001', 'sent');
    await dal.ticks.toggleTick('prob-001', 'project');
    await dal.ticks.toggleTick('prob-001', 'project'); // remove project
    const ticks = dal.ticks.getTicksForProblem('prob-001');
    expect(ticks.some((t: any) => t.tag === 'sent')).toBe(true);
    expect(ticks.some((t: any) => t.tag === 'project')).toBe(false);
  });
});

// ─── Local: getTicksForProblem / getUserCustomTags ────────────────────────────

describe('UserTickDAL local — read operations', () => {
  it('getTicksForProblem returns current user ticks for problem', async () => {
    const { dal } = await createTestDAL();
    await seedWallAndProblem(dal);
    await dal.ticks.toggleTick('prob-001', 'sent');
    await dal.ticks.toggleTick('prob-001', 'project');
    const ticks = dal.ticks.getTicksForProblem('prob-001');
    expect(ticks).toHaveLength(2);
    const tags = ticks.map((t: any) => t.tag);
    expect(tags).toContain('sent');
    expect(tags).toContain('project');
  });

  it('getUserCustomTags excludes built-in tags (sent, project)', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-001' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'p1' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'p2', name: 'P2' })));
    await dal.ticks.toggleTick('p1', 'sent');          // built-in — excluded
    await dal.ticks.toggleTick('p1', 'project');       // built-in — excluded
    await dal.ticks.toggleTick('p2', 'my-custom-tag'); // custom — included
    const custom = dal.ticks.getUserCustomTags();
    expect(custom).toContain('my-custom-tag');
    expect(custom).not.toContain('sent');
    expect(custom).not.toContain('project');
  });

  it('List({userId, problemId}) returns only ticks for that user and problem', async () => {
    const { dal, db } = await createTestDAL();
    await UserTable.insert({ id: 'other-user', name: 'Other' }, db as any);
    await seedWallAndProblem(dal);
    await dal.ticks.AddToLocal(new UserTick({ userId: 'test-user-001', problemId: 'prob-001', tag: 'sent' }));
    await dal.ticks.AddToLocal(new UserTick({ userId: 'other-user', problemId: 'prob-001', tag: 'project' }));
    const ticks = dal.ticks.List({ userId: 'test-user-001', problemId: 'prob-001' });
    expect(ticks).toHaveLength(1);
    expect(ticks[0].tag).toBe('sent');
  });
});

// ─── Local: removeTick ───────────────────────────────────────────────────────

describe('UserTickDAL local — removeTick', () => {
  it('removeTick(problemId, tag) removes only that specific tick', async () => {
    const { dal, db } = await createTestDAL();
    await seedWallAndProblem(dal);
    await dal.ticks.toggleTick('prob-001', 'sent');
    await dal.ticks.toggleTick('prob-001', 'project');
    await dal.ticks.removeTick('prob-001', 'sent');
    const ticks = dal.ticks.getTicksForProblem('prob-001');
    expect(ticks.some((t: any) => t.tag === 'sent')).toBe(false);
    expect(ticks.some((t: any) => t.tag === 'project')).toBe(true);
  });

  it('removeTick(problemId) with no tag removes ALL ticks for that problem', async () => {
    const { dal } = await createTestDAL();
    await seedWallAndProblem(dal);
    await dal.ticks.toggleTick('prob-001', 'sent');
    await dal.ticks.toggleTick('prob-001', 'project');
    await dal.ticks.removeTick('prob-001');
    expect(dal.ticks.getTicksForProblem('prob-001')).toHaveLength(0);
  });
});

// ─── Remote: FetchFromRemote ──────────────────────────────────────────────────

describe('UserTickDAL remote — FetchFromRemote', () => {
  it('adds tick from remote snapshot', async () => {
    const { dal } = await createTestDAL();
    await seedWallAndProblem(dal);

    getDocs.mockResolvedValueOnce({
      forEach: (cb: any) =>
        cb({
          id: 'tick-remote-001',
          data: () => ({
            id: 'tick-remote-001',
            userId: 'test-user-001',
            problemId: 'prob-001',
            tag: 'sent',
          }),
        }),
    });

    await dal.ticks.FetchFromRemote(since);
    const ticks = dal.ticks.getTicksForProblem('prob-001');
    expect(ticks).toHaveLength(1);
    expect(ticks[0].tag).toBe('sent');
  });

  it('FetchFromRemote is idempotent (no duplicate ticks)', async () => {
    const { dal, db } = await createTestDAL();
    await seedWallAndProblem(dal);

    const snap = {
      forEach: (cb: any) =>
        cb({
          id: 'tick-idem',
          data: () => ({ id: 'tick-idem', userId: 'test-user-001', problemId: 'prob-001', tag: 'project' }),
        }),
    };
    getDocs.mockResolvedValue(snap);

    await dal.ticks.FetchFromRemote(since);
    await dal.ticks.FetchFromRemote(since); // second call

    const stmt = db._raw.prepare(
      'SELECT COUNT(*) as cnt FROM user_ticks WHERE user_id = ? AND problem_id = ?',
    );
    stmt.bind(['test-user-001', 'prob-001']);
    stmt.step();
    expect((stmt.getAsObject() as any).cnt).toBe(1);
    stmt.free();
  });

  it('is_deleted removes tick', async () => {
    const { dal, db } = await createTestDAL();
    await seedWallAndProblem(dal);
    await dal.ticks.AddToLocal(new UserTick({ id: 'tick-del', userId: 'test-user-001', problemId: 'prob-001', tag: 'sent' }));

    getDocs.mockResolvedValueOnce({
      forEach: (cb: any) =>
        cb({ id: 'tick-del', data: () => ({ id: 'tick-del', is_deleted: true }) }),
    });

    await dal.ticks.FetchFromRemote(since);
    const stmt = db._raw.prepare('SELECT id FROM user_ticks WHERE id = ?');
    stmt.bind(['tick-del']);
    expect(stmt.step()).toBe(false);
    stmt.free();
  });
});
