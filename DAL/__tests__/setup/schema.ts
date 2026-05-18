import { createMockDatabase, MockDatabase } from '../mocks/expo-sqlite.mock';
import {
  UserTable,
  WallTable,
  ProblemTable,
  GroupTable,
  GroupMemberTable,
  GroupWallTable,
  GroupProblemTable,
  UserWallTable,
  UserTickTable,
  UserConfigTable,
} from '../../tables/tables';

// Creates an in-memory SQLite DB (via sql.js) with the full Flash schema.
// Call in beforeEach so each test starts with a clean slate.
export async function createTestDatabase(): Promise<MockDatabase> {
  const db = await createMockDatabase();
  // FK constraints on — must create tables in dependency order.
  await db.execAsync('PRAGMA foreign_keys = ON');
  await UserTable.createTable(db as any);
  await WallTable.createTable(db as any);
  await ProblemTable.createTable(db as any);
  await GroupTable.createTable(db as any);
  await GroupMemberTable.createTable(db as any);
  await GroupWallTable.createTable(db as any);
  await GroupProblemTable.createTable(db as any);
  await UserWallTable.createTable(db as any);
  await UserTickTable.createTable(db as any);
  await UserConfigTable.createTable(db as any);
  return db;
}

// Seed a user row + user_config row so FK constraints and config queries work.
export async function seedUser(
  db: MockDatabase,
  id = 'test-user-001',
  name = 'Test User',
): Promise<void> {
  await UserTable.insert({ id, name, image: undefined }, db as any);
  await UserConfigTable.insert({ user_id: id }, db as any);
}
