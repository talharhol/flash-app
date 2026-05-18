// Tests: write to local SQLite + call addToRemote, verify correct Firestore document.
// Requires: Firebase Emulator running on localhost:8080

import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { getTestFirestore } from '../setup/integrationSetup';
import { createTestDAL, makeWallData, makeProblemData } from '../helpers/testDal';
import { Wall } from '../../entities/wall';
import { Problem } from '../../entities/problem';

describe('Local → Remote: Wall', () => {
  it('Add() inserts wall into SQLite and creates Firestore document', async () => {
    const firestoreDB = getTestFirestore();
    const { dal, db } = await createTestDAL(firestoreDB);

    const wall = new Wall(makeWallData({ id: 'lt-wall-001', name: 'Integration Wall', isPublic: true }));
    // Bypass real image upload — set remoteImage directly and mock uploadAssets.
    wall.remoteImage = { commpressed: 'http://mock/c.jpg', full: 'http://mock/f.jpg' };
    jest.spyOn(wall as any, 'uploadAssets').mockResolvedValue(wall.toRemoteDoc());

    await dal.walls.Add(wall);

    // Assert SQLite row.
    const sqlRow = db._raw
      .prepare('SELECT id, name FROM wall WHERE id = ?')
      .getAsObject(['lt-wall-001']) as any;
    expect(sqlRow.id).toBe('lt-wall-001');
    expect(sqlRow.name).toBe('Integration Wall');

    // Assert Firestore document.
    const remoteDoc = await getDoc(doc(firestoreDB, 'wall', 'lt-wall-001'));
    expect(remoteDoc.exists()).toBe(true);
    expect(remoteDoc.data()!.name).toBe('Integration Wall');
    expect(remoteDoc.data()!.isPublic).toBe(true);
  });

  it('Remove() sets is_deleted on Firestore document', async () => {
    const firestoreDB = getTestFirestore();
    const { dal } = await createTestDAL(firestoreDB);

    const wall = new Wall(makeWallData({ id: 'lt-wall-del', isPublic: true }));
    wall.remoteImage = { commpressed: 'http://mock/c.jpg', full: 'http://mock/f.jpg' };
    jest.spyOn(wall as any, 'uploadAssets').mockResolvedValue(wall.toRemoteDoc());
    wall.setDAL(dal);

    // Seed Firestore doc directly (bypass BaseDAL.AddToRemote which doesn't
    // await the internal write), then verify deleteInRemote marks it deleted.
    await dal.walls.AddToLocal(wall);
    await setDoc(doc(firestoreDB, 'wall', 'lt-wall-del'), {
      ...wall.toRemoteDoc(),
      updated_at: Timestamp.now(),
    });

    await wall.deleteInRemote('wall');

    const remoteDoc = await getDoc(doc(firestoreDB, 'wall', 'lt-wall-del'));
    expect(remoteDoc.exists()).toBe(true);
    expect(remoteDoc.data()!.is_deleted).toBe(true);
  });

  it('Update() propagates new field values to Firestore', async () => {
    const firestoreDB = getTestFirestore();
    const { dal } = await createTestDAL(firestoreDB);

    const wall = new Wall(makeWallData({ id: 'lt-wall-upd', name: 'Before', isPublic: true }));
    wall.remoteImage = { commpressed: 'http://mock/c.jpg', full: 'http://mock/f.jpg' };
    jest.spyOn(wall as any, 'uploadAssets').mockResolvedValue(wall.toRemoteDoc());
    wall.setDAL(dal);

    await dal.walls.AddToLocal(wall);
    await wall.addToRemote('wall');

    wall.name = 'After';
    await dal.walls.UpdateLocal(wall);
    await wall.updateInRemote('wall');

    const remoteDoc = await getDoc(doc(firestoreDB, 'wall', 'lt-wall-upd'));
    expect(remoteDoc.data()!.name).toBe('After');
  });
});

describe('Local → Remote: Problem', () => {
  it('problem with holds array stored in Firestore correctly', async () => {
    const firestoreDB = getTestFirestore();
    const { dal } = await createTestDAL(firestoreDB);

    // Wall must exist locally (FK).
    const wall = new Wall(makeWallData({ id: 'wall-001', isPublic: true }));
    wall.remoteImage = { commpressed: 'http://mock/c.jpg', full: 'http://mock/f.jpg' };
    jest.spyOn(wall as any, 'uploadAssets').mockResolvedValue(wall.toRemoteDoc());
    await dal.walls.Add(wall);

    const holds = [{ x: 1, y: 2, color: '#000', svgPath: 'M 0 0', length: 5, label: 'H' }];
    const problem = new Problem(
      makeProblemData({ id: 'lt-prob-001', holds, wallId: 'wall-001', isPublic: true, setter: 'test-user-001' }),
    );
    problem.setDAL(dal);
    jest.spyOn(problem as any, 'uploadAssets').mockResolvedValue(problem.toRemoteDoc());

    await dal.problems.AddToLocal(problem);
    await dal.problems.AddToRemote(problem);

    const remoteDoc = await getDoc(doc(firestoreDB, 'problem', 'lt-prob-001'));
    expect(remoteDoc.exists()).toBe(true);
    expect(remoteDoc.data()!.holds).toEqual(holds);
    expect(remoteDoc.data()!.grade).toBe(5);
  });
});

describe('Local → Remote: replaceWallImage', () => {
  it('archive wall pushed to Firestore with activeWallId pointing to original', async () => {
    const firestoreDB = getTestFirestore();
    const { dal } = await createTestDAL(firestoreDB);

    // Seed original wall locally and in Firestore
    const original = new Wall({
      id: 'rw-original', name: 'My Wall', gym: 'Spot',
      image: { uri: 'file:///test/old.png' },
      isPublic: true, owner: 'test-user-001',
      configuredHolds: [{ x: 1, y: 2, color: '#F', svgPath: 'M 0 0', length: 5, label: 'H' }],
      version: 1,
      remoteImage: { commpressed: 'http://old-c.jpg', full: 'http://old-f.jpg' },
    } as any);
    original.setDAL(dal);
    await dal.walls.AddToLocal(original);

    await dal.walls.replaceWallImage('rw-original', 'file:///test/new.png');

    // Give fire-and-forget addToRemote time to settle
    await new Promise((r) => setTimeout(r, 1000));

    // Archive wall: in Firestore with activeWallId = original
    const archives = dal.walls.List({ activeWallId: 'rw-original' });
    expect(archives).toHaveLength(1);
    const archiveId = archives[0].id;

    const archiveDoc = await getDoc(doc(firestoreDB, 'wall', archiveId));
    expect(archiveDoc.exists()).toBe(true);
    expect(archiveDoc.data()!.activeWallId).toBe('rw-original');
    expect(archiveDoc.data()!.isPublic).toBe(true);
  });

  it('original wall version incremented in Firestore', async () => {
    const firestoreDB = getTestFirestore();
    const { dal } = await createTestDAL(firestoreDB);

    const original = new Wall({
      id: 'rw-version', name: 'Version Wall', gym: 'Gym',
      image: { uri: 'file:///test/v.png' },
      isPublic: true, owner: 'test-user-001',
      configuredHolds: [], version: 1,
      remoteImage: { commpressed: 'http://c.jpg', full: 'http://f.jpg' },
    } as any);
    original.setDAL(dal);
    await dal.walls.AddToLocal(original);
    // Seed in Firestore so updateInRemote can updateDoc
    await setDoc(doc(firestoreDB, 'wall', 'rw-version'), {
      ...original.toRemoteDoc(), updated_at: Timestamp.now(),
    });

    await dal.walls.replaceWallImage('rw-version', 'file:///test/new.png');
    await new Promise((r) => setTimeout(r, 1000));

    const remoteDoc = await getDoc(doc(firestoreDB, 'wall', 'rw-version'));
    expect(remoteDoc.data()!.version).toBe(2);
    expect(remoteDoc.data()!.configuredHolds).toEqual([]);
  });
});
