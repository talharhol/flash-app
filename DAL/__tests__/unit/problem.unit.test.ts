import { createTestDAL, makeWallData, makeProblemData } from '../helpers/testDal';
import { Wall } from '../../entities/wall';
import { Problem } from '../../entities/problem';
import { UserTick } from '../../entities/userTick';
import { UserWallTable, UserTable } from '../../tables/tables';

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

// Seed wall + problem before each test that needs them.
async function seedWallAndProblem(
  dal: any,
  wallId = 'wall-001',
  problemId = 'prob-001',
  problemOverrides: Partial<any> = {},
) {
  await dal.walls.AddToLocal(new Wall(makeWallData({ id: wallId })));
  const prob = new Problem(makeProblemData({ id: problemId, wallId, ...problemOverrides }));
  await dal.problems.AddToLocal(prob);
  return { wallId, problemId };
}

// ─── Local: Add / List ───────────────────────────────────────────────────────

describe('ProblemDAL local — Add and List', () => {
  it('AddToLocal inserts problem (FK: user and wall must exist)', async () => {
    const { dal, db } = await createTestDAL();
    await seedWallAndProblem(dal, 'wall-001', 'prob-001');
    const row = db._raw
      .prepare('SELECT id, name FROM problem WHERE id = ?')
      .getAsObject(['prob-001']) as any;
    expect(row.id).toBe('prob-001');
    expect(row.name).toBe('Test Problem');
  });

  it('List({wallId}) returns problems for that wall only', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-A' })));
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-B' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'p-A', wallId: 'wall-A' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'p-B', wallId: 'wall-B' })));
    const results = dal.problems.List({ wallId: 'wall-A' });
    expect(results.some((p) => p.id === 'p-A')).toBe(true);
    expect(results.some((p) => p.id === 'p-B')).toBe(false);
  });

  it('List({minGrade, maxGrade}) filters by grade range', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-001' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'easy', wallId: 'wall-001', grade: 3 })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'mid', wallId: 'wall-001', grade: 8 })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'hard', wallId: 'wall-001', grade: 15 })));
    const results = dal.problems.List({ minGrade: 5, maxGrade: 10 });
    const ids = results.map((p: any) => p.id);
    expect(ids).toContain('mid');
    expect(ids).not.toContain('easy');
    expect(ids).not.toContain('hard');
  });

  it('List({setters}) filters by owner', async () => {
    const { dal, db } = await createTestDAL();
    await UserTable.insert({ id: 'setter-2', name: 'Other Setter' }, db as any);
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-001' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'p-s1', setter: 'test-user-001' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'p-s2', setter: 'setter-2' })));
    const results = dal.problems.List({ setters: ['test-user-001'] });
    expect(results.some((p: any) => p.id === 'p-s1')).toBe(true);
    expect(results.some((p: any) => p.id === 'p-s2')).toBe(false);
  });

  it('List({name}) LIKE filter', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-001' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'crimpy', name: 'Crimpy Undercling' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'slopey', name: 'Slopey Heaven' })));
    const results = dal.problems.List({ name: 'Crimpy' });
    expect(results.some((p: any) => p.id === 'crimpy')).toBe(true);
    expect(results.some((p: any) => p.id === 'slopey')).toBe(false);
  });
});

// ─── Local: tag filtering (via UserTicks join) ────────────────────────────────

describe('ProblemDAL local — tag filtering', () => {
  it('tags:[unsent] excludes problems the user has already sent', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-001' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'unsent-prob' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'sent-prob', name: 'Sent Problem' })));

    const tick = new UserTick({ userId: 'test-user-001', problemId: 'sent-prob', tag: 'sent' });
    await dal.ticks.AddToLocal(tick);

    const results = dal.problems.List({ tags: ['unsent'] });
    const ids = results.map((p: any) => p.id);
    expect(ids).toContain('unsent-prob');
    expect(ids).not.toContain('sent-prob');
  });

  it('tags:[project] returns only problems with project tick', async () => {
    const { dal } = await createTestDAL();
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-001' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'proj-prob' })));
    await dal.problems.AddToLocal(new Problem(makeProblemData({ id: 'no-tick-prob', name: 'No tick' })));

    const tick = new UserTick({ userId: 'test-user-001', problemId: 'proj-prob', tag: 'project' });
    await dal.ticks.AddToLocal(tick);

    const results = dal.problems.List({ tags: ['project'] });
    const ids = results.map((p: any) => p.id);
    expect(ids).toContain('proj-prob');
    expect(ids).not.toContain('no-tick-prob');
  });
});

// ─── Local: Update / Remove ──────────────────────────────────────────────────

describe('ProblemDAL local — Update and Remove', () => {
  it('UpdateLocal changes grade', async () => {
    const { dal, db } = await createTestDAL();
    await seedWallAndProblem(dal, 'wall-001', 'prob-upd', { grade: 5 });
    const prob = dal.problems.List({ id: 'prob-upd' })[0];
    prob.grade = 12;
    await dal.problems.UpdateLocal(prob);
    const row = db._raw
      .prepare('SELECT grade FROM problem WHERE id = ?')
      .getAsObject(['prob-upd']) as any;
    expect(row.grade).toBe(12);
  });

  it('holds array roundtrips through UpdateLocal', async () => {
    const { dal } = await createTestDAL();
    const holds = [{ x: 1, y: 2, color: '#000', svgPath: 'M 0 0', length: 5, label: 'S' }];
    await seedWallAndProblem(dal, 'wall-001', 'prob-holds', { holds });
    const prob = dal.problems.List({ id: 'prob-holds' })[0];
    expect(prob.holds).toEqual(holds);
  });

  it('RemoveLocal deletes problem from SQLite', async () => {
    const { dal, db } = await createTestDAL();
    await seedWallAndProblem(dal, 'wall-001', 'prob-rm');
    const prob = dal.problems.List({ id: 'prob-rm' })[0];
    await dal.problems.RemoveLocal(prob);
    const stmt = db._raw.prepare('SELECT id FROM problem WHERE id = ?');
    stmt.bind(['prob-rm']);
    expect(stmt.step()).toBe(false);
    stmt.free();
  });
});

// ─── Remote: FetchFromRemote ──────────────────────────────────────────────────

describe('ProblemDAL remote — FetchFromRemote', () => {
  it('adds new problem when user owns the wall (user_wall row exists)', async () => {
    const { dal, db } = await createTestDAL();
    // Seed wall + user_wall so getRemoteFetchQuery includes this wall
    await dal.walls.AddToLocal(new Wall(makeWallData({ id: 'wall-001' })));
    await UserWallTable.insert(
      { wall_id: 'wall-001', user_id: 'test-user-001', role: 'owner' },
      db as any,
    );

    getDocs.mockResolvedValueOnce({
      forEach: (cb: any) =>
        cb({
          id: 'remote-prob-001',
          data: () => ({
            id: 'remote-prob-001',
            name: 'Remote Problem',
            wallId: 'wall-001',
            grade: 7,
            holds: [],
            setter: 'test-user-001',
            isPublic: true,
            type: 'boulder',
            wallVersion: 1,
          }),
        }),
    });

    await dal.problems.FetchFromRemote(since);
    const results = dal.problems.List({ id: 'remote-prob-001' });
    expect(results).toHaveLength(1);
    expect(results[0].grade).toBe(7);
  });

  it('is_deleted removes local problem', async () => {
    const { dal, db } = await createTestDAL();
    await seedWallAndProblem(dal, 'wall-001', 'del-prob');

    getDocs.mockResolvedValueOnce({
      forEach: (cb: any) =>
        cb({ id: 'del-prob', data: () => ({ id: 'del-prob', is_deleted: true }) }),
    });

    await dal.problems.FetchFromRemote(since);
    const stmt = db._raw.prepare('SELECT id FROM problem WHERE id = ?');
    stmt.bind(['del-prob']);
    expect(stmt.step()).toBe(false);
    stmt.free();
  });
});
