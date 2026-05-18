import { createTestDatabase, seedUser } from '../setup/schema';
import { MockDatabase } from '../mocks/expo-sqlite.mock';
import { WallTable, ProblemTable, UserTable } from '../../tables/tables';
import { Wall } from '../../entities/wall';
import { Problem } from '../../entities/problem';

let db: MockDatabase;

beforeEach(async () => {
  db = await createTestDatabase();
  await seedUser(db);
});

// ─── Insert + query roundtrip ────────────────────────────────────────────────

describe('WallTable — insert and retrieve', () => {
  it('stores and loads all scalar fields correctly', async () => {
    await WallTable.insert(
      {
        id: 'wall-001',
        name: 'Cave Wall',
        gym: 'Blochouse',
        image: { uri: 'file:///test/cave.png' },
        isPublic: true,
        owner: 'test-user-001',
        angle: 45,
        version: 1,
      },
      db as any,
    );

    const [sql, args] = WallTable.filter([WallTable.getField('id')!.eq('wall-001')]);
    const rows = db.getAllSync<any>(sql, args);
    expect(rows).toHaveLength(1);
    const row = WallTable.toEntity<Wall>(rows[0], Wall);
    expect(row.name).toBe('Cave Wall');
    expect(row.gym).toBe('Blochouse');
    expect(row.isPublic).toBe(true);
    expect(row.angle).toBe(45);
    expect(row.version).toBe(1);
  });

  it('image dumper stores the URI string and loader wraps it back in { uri }', async () => {
    await WallTable.insert(
      {
        id: 'wall-002',
        name: 'Slab',
        gym: 'Spot',
        image: { uri: 'file:///test/slab.png' },
        owner: 'test-user-001',
        isPublic: false,
        version: 1,
      },
      db as any,
    );

    const raw = db._raw.prepare('SELECT image FROM wall WHERE id = ?').getAsObject(['wall-002']) as any;
    expect(typeof raw.image).toBe('string');
    expect(raw.image).toBe('file:///test/slab.png');

    const [sql, args] = WallTable.filter([WallTable.getField('id')!.eq('wall-002')]);
    const rows = db.getAllSync<any>(sql, args);
    const row = WallTable.toEntity<Wall>(rows[0], Wall);
    expect(row.image).toEqual(expect.objectContaining({ uri: 'file:///test/slab.png' }));
  });
});

// ─── JSON field serialization ────────────────────────────────────────────────

describe('ProblemTable — JSON field (holds)', () => {
  it('roundtrips holds array through JSON dumper/loader', async () => {
    const holds = [
      { x: 10, y: 20, color: '#FF0000', svgPath: 'M 0 0 L 10 10', length: 15, label: 'A' },
      { x: 50, y: 80, color: '#00FF00', svgPath: 'M 5 5', length: 20, label: 'B' },
    ];

    await WallTable.insert({ id: 'wall-001', name: 'W', gym: 'G', image: { uri: 'file:///test/w.png' }, owner: 'test-user-001', isPublic: true, version: 1 }, db as any);
    await ProblemTable.insert(
      {
        id: 'prob-001',
        name: 'Crimpy',
        wallId: 'wall-001',
        setter: 'test-user-001',
        grade: 7,
        holds,
        isPublic: true,
        type: 'boulder',
        wallVersion: 1,
      },
      db as any,
    );

    // Raw DB stores holds as JSON string.
    const raw = db._raw.prepare('SELECT holds FROM problem WHERE id = ?').getAsObject(['prob-001']) as any;
    expect(typeof raw.holds).toBe('string');
    expect(() => JSON.parse(raw.holds)).not.toThrow();

    // Loaded entity has the original array — must use ProblemTable.getAll so loaders run.
    const [sql, args] = ProblemTable.filter([ProblemTable.getField('id')!.eq('prob-001')]);
    const rows = ProblemTable.getAll<any>(sql, args, db as any);
    const prob = ProblemTable.toEntity<Problem>(rows[0], Problem);
    expect(prob.holds).toEqual(holds);
  });
});

// ─── Soft-delete filter ──────────────────────────────────────────────────────

describe('BaseTable.filter — deleted_at IS NULL', () => {
  it('excludes soft-deleted rows', async () => {
    await WallTable.insert({ id: 'wall-keep', name: 'Keep', gym: 'G', image: { uri: 'file:///test/k.png' }, owner: 'other', isPublic: true, version: 1 }, db as any);
    await WallTable.insert({ id: 'wall-del', name: 'Gone', gym: 'G', image: { uri: 'file:///test/g.png' }, owner: 'other', isPublic: true, version: 1 }, db as any);

    // Soft-delete via raw SQL.
    db._raw.run('UPDATE wall SET deleted_at = ? WHERE id = ?', [Date.now(), 'wall-del']);

    const [sql, args] = WallTable.filter([]);
    const rows = db.getAllSync<any>(sql, args);
    const ids = rows.map((r: any) => r.id);
    expect(ids).toContain('wall-keep');
    expect(ids).not.toContain('wall-del');
  });
});

// ─── Update ──────────────────────────────────────────────────────────────────

describe('BaseTable.update', () => {
  it('updates specified fields without touching other rows', async () => {
    await WallTable.insert({ id: 'w1', name: 'Original', gym: 'G', image: { uri: 'file:///test/w.png' }, owner: 'other', isPublic: true, version: 1 }, db as any);
    await WallTable.insert({ id: 'w2', name: 'Other', gym: 'G', image: { uri: 'file:///test/w2.png' }, owner: 'other', isPublic: true, version: 1 }, db as any);

    await WallTable.update([WallTable.getField('id')!.eq('w1')], { name: 'Updated' }, db as any);

    const [sql, args] = WallTable.filter([WallTable.getField('id')!.eq('w1')]);
    const rows = db.getAllSync<any>(sql, args);
    expect(rows[0].name).toBe('Updated');

    const [sql2, args2] = WallTable.filter([WallTable.getField('id')!.eq('w2')]);
    const rows2 = db.getAllSync<any>(sql2, args2);
    expect(rows2[0].name).toBe('Other');
  });
});

// ─── Delete ──────────────────────────────────────────────────────────────────

describe('BaseTable.delete', () => {
  it('hard-deletes matching rows only', async () => {
    await WallTable.insert({ id: 'del-me', name: 'D', gym: 'G', image: { uri: 'file:///test/d.png' }, owner: 'other', isPublic: true, version: 1 }, db as any);
    await WallTable.insert({ id: 'keep-me', name: 'K', gym: 'G', image: { uri: 'file:///test/k.png' }, owner: 'other', isPublic: true, version: 1 }, db as any);

    await WallTable.delete([WallTable.getField('id')!.eq('del-me')], db as any);

    const all = db._raw.prepare('SELECT id FROM wall').getAsObject ?
      (() => {
        const s = db._raw.prepare('SELECT id FROM wall');
        const r: any[] = [];
        while(s.step()) r.push(s.getAsObject());
        s.free();
        return r;
      })() : [];
    const ids = all.map((r: any) => r.id);
    expect(ids).not.toContain('del-me');
    expect(ids).toContain('keep-me');
  });
});

// ─── IN filter ───────────────────────────────────────────────────────────────

describe('Field.in filter', () => {
  it('returns only rows whose id is in the provided list', async () => {
    await WallTable.insert({ id: 'a', name: 'A', gym: 'G', image: { uri: 'file:///test/a.png' }, owner: 'other', isPublic: true, version: 1 }, db as any);
    await WallTable.insert({ id: 'b', name: 'B', gym: 'G', image: { uri: 'file:///test/b.png' }, owner: 'other', isPublic: true, version: 1 }, db as any);
    await WallTable.insert({ id: 'c', name: 'C', gym: 'G', image: { uri: 'file:///test/c.png' }, owner: 'other', isPublic: true, version: 1 }, db as any);

    const [sql, args] = WallTable.filter([WallTable.getField('id')!.in(['a', 'c'])]);
    const rows = db.getAllSync<any>(sql, args);
    expect(rows).toHaveLength(2);
    expect(rows.map((r: any) => r.id).sort()).toEqual(['a', 'c']);
  });
});

// ─── Query builder ───────────────────────────────────────────────────────────

describe('Query builder', () => {
  it('Query.All with LIKE filter returns matching rows', async () => {
    await WallTable.insert({ id: 'x1', name: 'Boulder Cave', gym: 'Spot', image: { uri: 'file:///test/x1.png' }, owner: 'other', isPublic: true, version: 1 }, db as any);
    await WallTable.insert({ id: 'x2', name: 'Slab Heaven', gym: 'Spot', image: { uri: 'file:///test/x2.png' }, owner: 'other', isPublic: true, version: 1 }, db as any);

    const query = WallTable.query([WallTable.getField('name')!.like('Boulder')]);
    const results = query.All<any>(db as any);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Boulder Cave');
  });

  it('Query.First returns null gracefully when no row matches', () => {
    const query = WallTable.query([WallTable.getField('id')!.eq('nonexistent')]);
    const result = query.First<any>(db as any);
    expect(result).toEqual({}); // BaseTable.First returns {} on null per the impl
  });
});
