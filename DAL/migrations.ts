import * as SQLite from 'expo-sqlite';
import dalService from './DALService';
import { Group, GroupMember, GroupProblem, GroupWall, Problem, User, Wall } from './tables/tables';



export async function runMigrations() {
    const db = await SQLite.openDatabaseAsync('flashLocalDB.db');
    let currentVersion = await getCurrentVersion(db);
    while (currentVersion < migrations.length) {
        await migrations[currentVersion](db)
        currentVersion += 1;
        alert("run migrtion")
    }
    await db.execAsync(`PRAGMA user_version = ${migrations.length}`);
    await dalService.connect();
}

async function getCurrentVersion(db: SQLite.SQLiteDatabase): Promise<number> {
    let dbResult = await db.getFirstAsync<{ user_version: number }>(
        'PRAGMA user_version'
    );
    return dbResult!.user_version;
}


const migrations = [
    async (db: SQLite.SQLiteDatabase) => {
        await User.create(db);
        await Wall.create(db);
        await Problem.create(db);
        await Group.create(db);
        await GroupMember.create(db);
        await GroupWall.create(db);
        await GroupProblem.create(db);
    },    
];
