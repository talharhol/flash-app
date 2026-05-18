// Creates a lightweight IDAL-compatible object backed by sql.js + optional real Firestore.
// Does NOT use DalService to avoid singleton and RN boot issues.

import { EventEmitter } from 'events';
import { Firestore } from 'firebase/firestore';
import { WallDAL } from '../../dals/wall';
import { UserDAL } from '../../dals/user';
import { ProblemDAL } from '../../dals/problem';
import { GroupDAL } from '../../dals/group';
import { UserTickDAL } from '../../dals/userTick';
import {
  WallTable,
  UserTable,
  ProblemTable,
  GroupTable,
  UserTickTable,
} from '../../tables/tables';
import { createTestDatabase, seedUser } from '../setup/schema';
import { MockDatabase } from '../mocks/expo-sqlite.mock';

export interface TestDALInstance {
  dal: any;
  db: MockDatabase;
}

export async function createTestDAL(remoteDB?: Firestore): Promise<TestDALInstance> {
  const db = await createTestDatabase();
  await seedUser(db); // seed test-user-001 so FK constraints pass

  const mockDAL: any = new EventEmitter();
  mockDAL.db = db;
  mockDAL.remoteDB = remoteDB ?? {};
  mockDAL.remoteStorage = {
    uploadFile: jest.fn().mockResolvedValue('http://mock-storage/file.png'),
  };
  mockDAL.isLogin = true;
  mockDAL.currentUser = {
    id: 'test-user-001',
    name: 'Test User',
    lastPulled: 0,
    shouldFetchUserData: false,
    walls: [],
  };
  mockDAL.updateScreen = jest.fn();
  mockDAL.compressImage = jest.fn().mockResolvedValue('file:///test/compressed.jpg');
  mockDAL.resizeImage = jest.fn().mockResolvedValue('file:///test/resized.jpg');
  mockDAL.convertToLocalImage = jest.fn().mockResolvedValue('file:///test/local.jpg');
  mockDAL.signin = jest.fn().mockResolvedValue(undefined);
  mockDAL.signup = jest.fn().mockResolvedValue(undefined);

  mockDAL.walls = new WallDAL(mockDAL, WallTable, 'wall');
  mockDAL.users = new UserDAL(mockDAL, UserTable, 'user');
  mockDAL.problems = new ProblemDAL(mockDAL, ProblemTable, 'problem');
  mockDAL.groups = new GroupDAL(mockDAL, GroupTable, 'group');
  mockDAL.ticks = new UserTickDAL(mockDAL, UserTickTable, 'user_tick');

  return { dal: mockDAL, db };
}

// Convenience: a test Wall payload using file:///test/ prefix so the image
// dumper in tables.ts detects it as local and skips the file copy.
export function makeWallData(overrides: Partial<any> = {}) {
  return {
    id: 'wall-001',
    name: 'Test Wall',
    gym: 'Test Gym',
    image: { uri: 'file:///test/wall.png' },
    owner: 'other-user', // not currentUser.id → avoids AddWall FK side-effect
    isPublic: true,
    configuredHolds: [],
    version: 1,
    ...overrides,
  };
}

export function makeProblemData(overrides: Partial<any> = {}) {
  return {
    id: 'problem-001',
    name: 'Test Problem',
    wallId: 'wall-001',
    grade: 5,
    holds: [{ x: 10, y: 20, color: '#FF0000', svgPath: 'M 0 0', length: 10, label: 'A' }],
    setter: 'test-user-001',
    isPublic: true,
    type: 'boulder',
    wallVersion: 1,
    ...overrides,
  };
}
